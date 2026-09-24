import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db, { initDb } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function seedDatabase() {
  if (process.env.DB_HOST) {
    console.log("Skipping seed: MySQL mode (use deploy SQL instead).");
    return;
  }

  const existing = await db.prepare("SELECT id FROM restaurants LIMIT 1").get();
  if (existing) {
    console.log("Database already seeded.");
    return;
  }

  const menuPath = path.join(__dirname, "../../data/menu-seed.json");
  const menu = JSON.parse(fs.readFileSync(menuPath, "utf8"));

  const insertRestaurant = db.prepare(`
    INSERT INTO restaurants (name, slug, whatsapp, banner_url, phone, address, is_open, min_order, delivery_fee, prep_time)
    VALUES (?, ?, ?, ?, ?, ?, 1, 25, 5, 30)
  `);

  const restaurant = await insertRestaurant.run(
    "Burger Falcone",
    "burger-falcone",
    "5535987216486",
    "assets/products/burger-banner.jpg",
    "(35) 98721-6486",
    "Rua Exemplo, 123 — Centro"
  );
  const restaurantId = restaurant.lastInsertRowid;

  const passwordHash = bcrypt.hashSync("admin123", 10);
  await db.prepare(`
    INSERT INTO users (restaurant_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(restaurantId, "Administrador", "admin@burgerfalcone.com", passwordHash, "admin");

  await db.prepare(`
    INSERT INTO users (restaurant_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(restaurantId, "Cozinha", "cozinha@burgerfalcone.com", passwordHash, "kitchen");

  const categoryMap = {};
  const insertCategory = db.prepare(`
    INSERT INTO categories (restaurant_id, slug, label, sort_order, active)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (let index = 0; index < menu.categories.length; index++) {
    const cat = menu.categories[index];
    const result = await insertCategory.run(restaurantId, cat.id, cat.label, index);
    categoryMap[cat.id] = result.lastInsertRowid;
  }

  const highlightSet = new Set(menu.highlights);
  const insertProduct = db.prepare(`
    INSERT INTO products (
      restaurant_id, category_id, slug, name, description, price, image_url,
      badge, is_highlight, sort_order, available, prep_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 15)
  `);

  const categoryCounters = {};
  for (const product of menu.products) {
    const categoryId = categoryMap[product.category];
    if (!categoryId) continue;
    categoryCounters[product.category] = (categoryCounters[product.category] || 0) + 1;
    await insertProduct.run(
      restaurantId,
      categoryId,
      product.id,
      product.name,
      product.description,
      product.price,
      product.image,
      product.badge,
      highlightSet.has(product.id) ? 1 : 0,
      categoryCounters[product.category]
    );
  }

  const paymentMethods = [
    ["Pix", "pix"],
    ["Dinheiro", "dinheiro"],
    ["Cartão de Crédito", "cartao-credito"],
    ["Cartão de Débito", "cartao-debito"],
    ["Vale-refeição", "vale-refeicao"],
  ];
  const insertPayment = db.prepare(`
    INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order)
    VALUES (?, ?, ?, 1, ?)
  `);
  for (let i = 0; i < paymentMethods.length; i++) {
    const [name, slug] = paymentMethods[i];
    await insertPayment.run(restaurantId, name, slug, i);
  }

  const cheeseGroup = (await db.prepare(`
    INSERT INTO addon_groups (restaurant_id, name, min_qty, max_qty, required, sort_order)
    VALUES (?, 'Escolha seu queijo', 0, 1, 0, 0)
  `).run(restaurantId)).lastInsertRowid;

  const extrasGroup = (await db.prepare(`
    INSERT INTO addon_groups (restaurant_id, name, min_qty, max_qty, required, sort_order)
    VALUES (?, 'Adicionais', 0, 10, 0, 1)
  `).run(restaurantId)).lastInsertRowid;

  const insertAddon = db.prepare(`
    INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (?, ?, ?, ?, 1)
  `);
  const addonItems = [
    [cheeseGroup, "Cheddar", 3, 0],
    [cheeseGroup, "Mussarela", 2.5, 1],
    [cheeseGroup, "Gorgonzola", 4, 2],
    [extrasGroup, "Bacon", 5, 0],
    [extrasGroup, "Ovo", 2, 1],
    [extrasGroup, "Cebola caramelizada", 3, 2],
  ];
  for (const [groupId, name, price, order] of addonItems) {
    await insertAddon.run(groupId, name, price, order);
  }

  const zones = [
    ["Centro", 5],
    ["Jardim", 7],
    ["Vila Nova", 8],
    ["Bairro Industrial", 10],
  ];
  const insertZone = db.prepare(`
    INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (?, ?, ?, 1)
  `);
  for (const [name, fee] of zones) {
    await insertZone.run(restaurantId, name, fee);
  }

  await db.prepare(`
    INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, min_order, active, usage_limit)
    VALUES (?, 'HAMB10', 'percent', 10, 50, 1, 100)
  `).run(restaurantId);

  const products = await db.prepare("SELECT id, name FROM products WHERE restaurant_id = ? LIMIT 20").all(restaurantId);
  const insertStock = db.prepare(`
    INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit)
    VALUES (?, ?, ?, ?, ?, 'un')
  `);
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    await insertStock.run(restaurantId, p.id, p.name, 50 - i * 2, 5);
  }

  await db.prepare(`
    INSERT INTO expenses (restaurant_id, description, category, amount, payment_method, expense_date)
    VALUES (?, 'Compra de ingredientes semanal', 'ingredientes', 850, 'Pix', date('now', '-2 days'))
  `).run(restaurantId);

  console.log("Database seeded successfully!");
  console.log("Admin login: admin@burgerfalcone.com / admin123");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  (async () => {
    await initDb();
    if (!process.env.DB_HOST) await seedDatabase();
  })();
}
