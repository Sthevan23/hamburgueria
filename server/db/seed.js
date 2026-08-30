import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db, { initDatabase } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function seedDatabase() {
  initDatabase();

  const existing = db.prepare("SELECT id FROM restaurants LIMIT 1").get();
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

  const restaurant = insertRestaurant.run(
    "Burger Falcone",
    "burger-falcone",
    "5500000000000",
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1400&q=80",
    "(00) 00000-0000",
    "Rua Exemplo, 123 — Centro"
  );
  const restaurantId = restaurant.lastInsertRowid;

  const passwordHash = bcrypt.hashSync("admin123", 10);
  db.prepare(`
    INSERT INTO users (restaurant_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(restaurantId, "Administrador", "admin@burgerfalcone.com", passwordHash, "admin");

  db.prepare(`
    INSERT INTO users (restaurant_id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(restaurantId, "Cozinha", "cozinha@burgerfalcone.com", passwordHash, "kitchen");

  const categoryMap = {};
  const insertCategory = db.prepare(`
    INSERT INTO categories (restaurant_id, slug, label, sort_order, active)
    VALUES (?, ?, ?, ?, 1)
  `);

  menu.categories.forEach((cat, index) => {
    const result = insertCategory.run(restaurantId, cat.id, cat.label, index);
    categoryMap[cat.id] = result.lastInsertRowid;
  });

  const highlightSet = new Set(menu.highlights);
  const insertProduct = db.prepare(`
    INSERT INTO products (
      restaurant_id, category_id, slug, name, description, price, image_url,
      badge, is_highlight, sort_order, available, prep_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 15)
  `);

  const categoryCounters = {};
  menu.products.forEach((product) => {
    const categoryId = categoryMap[product.category];
    if (!categoryId) return;
    categoryCounters[product.category] = (categoryCounters[product.category] || 0) + 1;
    insertProduct.run(
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
  });

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
  paymentMethods.forEach(([name, slug], i) => {
    insertPayment.run(restaurantId, name, slug, i);
  });

  const cheeseGroup = db.prepare(`
    INSERT INTO addon_groups (restaurant_id, name, min_qty, max_qty, required, sort_order)
    VALUES (?, 'Escolha seu queijo', 0, 1, 0, 0)
  `).run(restaurantId).lastInsertRowid;

  const extrasGroup = db.prepare(`
    INSERT INTO addon_groups (restaurant_id, name, min_qty, max_qty, required, sort_order)
    VALUES (?, 'Adicionais', 0, 10, 0, 1)
  `).run(restaurantId).lastInsertRowid;

  const insertAddon = db.prepare(`
    INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (?, ?, ?, ?, 1)
  `);
  [
    [cheeseGroup, "Cheddar", 3, 0],
    [cheeseGroup, "Mussarela", 2.5, 1],
    [cheeseGroup, "Gorgonzola", 4, 2],
    [extrasGroup, "Bacon", 5, 0],
    [extrasGroup, "Ovo", 2, 1],
    [extrasGroup, "Cebola caramelizada", 3, 2],
  ].forEach(([groupId, name, price, order]) => insertAddon.run(groupId, name, price, order));

  const zones = [
    ["Centro", 5],
    ["Jardim", 7],
    ["Vila Nova", 8],
    ["Bairro Industrial", 10],
  ];
  const insertZone = db.prepare(`
    INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (?, ?, ?, 1)
  `);
  zones.forEach(([name, fee]) => insertZone.run(restaurantId, name, fee));

  db.prepare(`
    INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, min_order, active, usage_limit)
    VALUES (?, 'HAMB10', 'percent', 10, 50, 1, 100)
  `).run(restaurantId);

  const products = db.prepare("SELECT id, name FROM products WHERE restaurant_id = ? LIMIT 20").all(restaurantId);
  const insertStock = db.prepare(`
    INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit)
    VALUES (?, ?, ?, ?, ?, 'un')
  `);
  products.forEach((p, i) => {
    insertStock.run(restaurantId, p.id, p.name, 50 - i * 2, 5);
  });

  db.prepare(`
    INSERT INTO expenses (restaurant_id, description, category, amount, payment_method, expense_date)
    VALUES (?, 'Compra de ingredientes semanal', 'ingredientes', 850, 'Pix', date('now', '-2 days'))
  `).run(restaurantId);

  console.log("Database seeded successfully!");
  console.log("Admin login: admin@burgerfalcone.com / admin123");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  seedDatabase();
}
