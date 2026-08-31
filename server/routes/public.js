import { Router } from "express";
import db from "../db/client.js";

const router = Router();

router.get("/menu", async (req, res) => {
  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE slug = ?").get("burger-falcone");
  if (!restaurant) return res.status(404).json({ error: "Restaurante não encontrado." });

  const categories = await db
    .prepare("SELECT slug as id, label FROM categories WHERE restaurant_id = ? AND active = 1 ORDER BY sort_order")
    .all(restaurant.id);

  const products = await db
    .prepare(`
      SELECT p.slug as id, p.name, p.description, p.price, p.promo_price, p.image_url as image,
             p.badge, c.slug as category, p.is_highlight
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.restaurant_id = ? AND p.available = 1 AND c.active = 1
      ORDER BY p.sort_order
    `)
    .all(restaurant.id);

  const highlights = products.filter((p) => p.is_highlight).map((p) => p.id);

  const groups = await db
    .prepare(`
      SELECT ag.id, ag.name, ag.min_qty, ag.max_qty, ag.required
      FROM addon_groups ag
      WHERE ag.restaurant_id = ? AND ag.active = 1
      ORDER BY ag.sort_order
    `)
    .all(restaurant.id);

  const addonGroups = [];
  for (const group of groups) {
    const addons = await db
      .prepare("SELECT id, name, price FROM addons WHERE group_id = ? AND active = 1 ORDER BY sort_order")
      .all(group.id);
    addonGroups.push({
      ...group,
      required: !!group.required,
      addons,
    });
  }

  const paymentRows = await db
    .prepare("SELECT name FROM payment_methods WHERE restaurant_id = ? AND active = 1 ORDER BY sort_order")
    .all(restaurant.id);
  const paymentMethods = paymentRows.map((p) => p.name);

  res.json({
    restaurant: {
      name: restaurant.name,
      logoUrl: restaurant.logo_url,
      bannerUrl: restaurant.banner_url,
      phone: restaurant.phone,
      whatsapp: restaurant.whatsapp,
      address: restaurant.address,
      isOpen: !!restaurant.is_open,
      closedMessage: restaurant.closed_message,
      minOrder: restaurant.min_order,
      deliveryFee: restaurant.delivery_fee,
      prepTime: restaurant.prep_time,
      schedule: JSON.parse(restaurant.schedule_json || "{}"),
    },
    categories,
    products: products.map(({ is_highlight, promo_price, ...p }) => ({
      ...p,
      price: promo_price ?? p.price,
      originalPrice: promo_price ? p.price : null,
    })),
    highlights,
    addonGroups,
    paymentMethods,
  });
});

router.get("/status", async (req, res) => {
  const restaurant = await db.prepare("SELECT is_open, closed_message FROM restaurants WHERE slug = ?").get("burger-falcone");
  if (!restaurant) return res.status(404).json({ error: "Restaurante não encontrado." });
  res.json({ isOpen: !!restaurant.is_open, closedMessage: restaurant.closed_message });
});

router.post("/orders", async (req, res) => {
  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE slug = ?").get("burger-falcone");
  if (!restaurant) return res.status(404).json({ error: "Restaurante não encontrado." });
  if (!restaurant.is_open) {
    return res.status(403).json({ error: restaurant.closed_message || "Restaurante fechado." });
  }

  const { customer, items, paymentMethod, notes, type = "delivery", couponCode } = req.body;
  if (!customer?.name || !items?.length) {
    return res.status(400).json({ error: "Dados do pedido incompletos." });
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await db
      .prepare("SELECT * FROM products WHERE restaurant_id = ? AND slug = ? AND available = 1")
      .get(restaurant.id, item.id);
    if (!product) return res.status(400).json({ error: `Produto não encontrado: ${item.id}` });

    const unitPrice = product.promo_price ?? product.price;
    const addonsTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
    const lineTotal = (unitPrice + addonsTotal) * item.qty;
    subtotal += lineTotal;

    orderItems.push({
      product,
      qty: item.qty,
      unitPrice: unitPrice + addonsTotal,
      lineTotal,
      addons: item.addons || [],
      notes: item.notes || "",
    });
  }

  let discount = 0;
  if (couponCode) {
    const coupon = await db
      .prepare("SELECT * FROM coupons WHERE restaurant_id = ? AND code = ? AND active = 1")
      .get(restaurant.id, couponCode.toUpperCase());
    if (coupon && subtotal >= coupon.min_order) {
      discount = coupon.discount_type === "percent" ? subtotal * (coupon.discount_value / 100) : coupon.discount_value;
      await db.prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?").run(coupon.id);
    }
  }

  const deliveryFee = type === "delivery" ? restaurant.delivery_fee : 0;
  const total = subtotal + deliveryFee - discount;

  if (total < restaurant.min_order) {
    return res.status(400).json({ error: `Pedido mínimo: R$ ${restaurant.min_order.toFixed(2)}` });
  }

  const lastOrder = await db
    .prepare("SELECT MAX(order_number) as num FROM orders WHERE restaurant_id = ?")
    .get(restaurant.id);
  const orderNumber = (lastOrder?.num || 100) + 1;

  const addressText = customer.address
    ? `${customer.address}, Nº ${customer.number || "S/N"}${customer.complement ? ` — ${customer.complement}` : ""}${customer.neighborhood ? ` — ${customer.neighborhood}` : ""}`
    : null;

  let customerId = null;
  if (customer.phone) {
    const existing = await db
      .prepare("SELECT id FROM customers WHERE restaurant_id = ? AND phone = ?")
      .get(restaurant.id, customer.phone);
    if (existing) {
      customerId = existing.id;
      await db.prepare(`
        UPDATE customers SET name = ?, total_orders = total_orders + 1, total_spent = total_spent + ?,
        last_order_at = datetime('now') WHERE id = ?
      `).run(customer.name, total, customerId);
    } else {
      const result = await db
        .prepare(`
          INSERT INTO customers (restaurant_id, name, phone, email, total_orders, total_spent, last_order_at)
          VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
        `)
        .run(restaurant.id, customer.name, customer.phone, customer.email || null, total);
      customerId = result.lastInsertRowid;
    }
  }

  const orderResult = await db.prepare(`
    INSERT INTO orders (restaurant_id, customer_id, order_number, status, type, customer_name, customer_phone,
      address_text, payment_method, notes, subtotal, delivery_fee, discount, total, coupon_code)
    VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    restaurant.id, customerId, orderNumber, type, customer.name, customer.phone || null,
    addressText, paymentMethod, notes || null, subtotal, deliveryFee, discount, total, couponCode || null
  );

  const orderId = orderResult.lastInsertRowid;
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAddon = db.prepare(`
    INSERT INTO order_item_addons (order_item_id, addon_name, price) VALUES (?, ?, ?)
  `);

  for (const item of orderItems) {
    const itemResult = await insertItem.run(
      orderId, item.product.id, item.product.name, item.qty, item.unitPrice, item.lineTotal, item.notes
    );
    for (const addon of item.addons) {
      await insertAddon.run(itemResult.lastInsertRowid, addon.name, addon.price || 0);
    }
  }

  await db.prepare(`
    INSERT INTO notifications (restaurant_id, type, title, message, data_json)
    VALUES (?, 'new_order', ?, ?, ?)
  `).run(
    restaurant.id,
    `Novo pedido #${orderNumber}`,
    `${customer.name} — ${paymentMethod}`,
    JSON.stringify({ orderId, orderNumber })
  );

  res.status(201).json({ orderId, orderNumber, total, whatsapp: restaurant.whatsapp });
});

export default router;
