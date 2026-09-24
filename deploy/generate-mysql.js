import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/menu-seed.json"), "utf8"));
const hash = bcrypt.hashSync("admin123", 10);

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

const sql = [];

sql.push("-- Burger Falcone — MySQL para Hostinger");
sql.push("-- Importe no phpMyAdmin: Bancos de dados > Importar");
sql.push("SET NAMES utf8mb4;");
sql.push("SET FOREIGN_KEY_CHECKS = 0;");

for (const table of [
  "notifications", "coupons", "expenses", "stock_movements", "stock",
  "order_item_addons", "order_items", "orders", "payment_methods", "delivery_zones",
  "addresses", "customers", "product_addon_groups", "addons", "addon_groups",
  "products", "categories", "users", "restaurants",
]) {
  sql.push(`DROP TABLE IF EXISTS ${table};`);
}

sql.push("SET FOREIGN_KEY_CHECKS = 1;\n");

sql.push(`CREATE TABLE restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT, banner_url TEXT, phone VARCHAR(50), whatsapp VARCHAR(30), address TEXT,
  is_open TINYINT(1) DEFAULT 1,
  closed_message TEXT DEFAULT 'Estamos fechados no momento. Volte em breve!',
  min_order DECIMAL(10,2) DEFAULT 0, delivery_fee DECIMAL(10,2) DEFAULT 0, prep_time INT DEFAULT 30,
  schedule_json JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', permissions_json JSON, active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, slug VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL, sort_order INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_restaurant_slug (restaurant_id, slug),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, category_id INT NOT NULL,
  slug VARCHAR(150) NOT NULL, name VARCHAR(255) NOT NULL, description TEXT,
  price DECIMAL(10,2) NOT NULL, promo_price DECIMAL(10,2), sku VARCHAR(100), image_url TEXT,
  badge VARCHAR(100), prep_time INT DEFAULT 15, is_highlight TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0, available TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_restaurant_product_slug (restaurant_id, slug),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE addon_groups (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  min_qty INT DEFAULT 0, max_qty INT DEFAULT 10, required TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE addons (
  id INT AUTO_INCREMENT PRIMARY KEY, group_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0, sort_order INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE product_addon_groups (
  product_id INT NOT NULL, group_id INT NOT NULL, PRIMARY KEY (product_id, group_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  phone VARCHAR(30), email VARCHAR(255), total_orders INT DEFAULT 0, total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, street VARCHAR(255), number VARCHAR(20),
  complement VARCHAR(255), neighborhood VARCHAR(255), city VARCHAR(255), is_default TINYINT(1) DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE delivery_zones (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0, active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL, active TINYINT(1) DEFAULT 1, sort_order INT DEFAULT 0,
  UNIQUE KEY uq_restaurant_payment (restaurant_id, slug),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, customer_id INT, order_number INT NOT NULL,
  status VARCHAR(30) DEFAULT 'new', type VARCHAR(20) DEFAULT 'delivery',
  customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(30), address_text TEXT,
  payment_method VARCHAR(100), notes TEXT, subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0, discount DECIMAL(10,2) DEFAULT 0, total DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(50), created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  accepted_at DATETIME, completed_at DATETIME,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id), FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, product_id INT, product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL, unit_price DECIMAL(10,2) NOT NULL, total_price DECIMAL(10,2) NOT NULL, notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE order_item_addons (
  id INT AUTO_INCREMENT PRIMARY KEY, order_item_id INT NOT NULL, addon_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE stock (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, product_id INT, name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0, min_quantity DECIMAL(10,2) DEFAULT 5, unit VARCHAR(20) DEFAULT 'un',
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id), FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY, stock_id INT NOT NULL, type VARCHAR(20) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, reason TEXT, user_id INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, amount DECIMAL(10,2) NOT NULL, payment_method VARCHAR(100),
  notes TEXT, expense_date DATE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL, discount_value DECIMAL(10,2) NOT NULL, min_order DECIMAL(10,2) DEFAULT 0,
  start_date DATE, end_date DATE, usage_limit INT, used_count INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_restaurant_coupon (restaurant_id, code),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push(`CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, user_id INT, type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL, message TEXT, \`read\` TINYINT(1) DEFAULT 0, data_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

sql.push("CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);");
sql.push("CREATE INDEX idx_orders_status ON orders(status);");
sql.push("CREATE INDEX idx_orders_created ON orders(created_at);");
sql.push("CREATE INDEX idx_products_category ON products(category_id);");
sql.push("CREATE INDEX idx_customers_phone ON customers(phone);\n");

sql.push(`INSERT INTO restaurants (name, slug, whatsapp, banner_url, phone, address, is_open, min_order, delivery_fee, prep_time, schedule_json) VALUES (
  'Burger Falcone', 'burger-falcone', '5535987216486',
  'assets/products/burger-banner.jpg',
  '(35) 98721-6486', 'Rua Exemplo, 123 - Centro', 1, 25, 5, 30,
  '{"days":[0,2,3,4,5,6],"open":"18:00","close":"23:30"}'
);`);

sql.push(`INSERT INTO users (restaurant_id, name, email, password_hash, role) VALUES
(1, 'Administrador', 'admin@burgerfalcone.com', ${esc(hash)}, 'admin'),
(1, 'Cozinha', 'cozinha@burgerfalcone.com', ${esc(hash)}, 'kitchen');`);

menu.categories.forEach((cat, i) => {
  sql.push(`INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, ${esc(cat.id)}, ${esc(cat.label)}, ${i}, 1);`);
});

const catIds = {};
menu.categories.forEach((cat, i) => { catIds[cat.id] = i + 1; });
const highlights = new Set(menu.highlights);
const counters = {};

menu.products.forEach((p) => {
  counters[p.category] = (counters[p.category] || 0) + 1;
  const cid = catIds[p.category];
  if (!cid) return;
  sql.push(
    `INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, ${cid}, ${esc(p.id)}, ${esc(p.name)}, ${esc(p.description)}, ${p.price}, ${esc(p.image)}, ${esc(p.badge)}, ${highlights.has(p.id) ? 1 : 0}, ${counters[p.category]}, 1, 15);`
  );
});

[
  ["Pix", "pix", 0], ["Dinheiro", "dinheiro", 1], ["Cartão de Crédito", "cartao-credito", 2],
  ["Cartão de Débito", "cartao-debito", 3], ["Vale-refeição", "vale-refeicao", 4],
].forEach(([n, s, o]) => sql.push(`INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order) VALUES (1, ${esc(n)}, ${esc(s)}, 1, ${o});`));

sql.push(`INSERT INTO addon_groups (id, restaurant_id, name, min_qty, max_qty, required, sort_order, active) VALUES
(1, 1, 'Escolha seu queijo', 0, 1, 0, 0, 1), (2, 1, 'Adicionais', 0, 10, 0, 1, 1);`);

[
  [1, "Cheddar", 3, 0], [1, "Mussarela", 2.5, 1], [1, "Gorgonzola", 4, 2],
  [2, "Bacon", 5, 0], [2, "Ovo", 2, 1], [2, "Cebola caramelizada", 3, 2],
].forEach(([g, n, p, o]) => sql.push(`INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (${g}, ${esc(n)}, ${p}, ${o}, 1);`));

[["Centro", 5], ["Jardim", 7], ["Vila Nova", 8], ["Bairro Industrial", 10]].forEach(([n, f]) => {
  sql.push(`INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (1, ${esc(n)}, ${f}, 1);`);
});

sql.push(`INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, min_order, active, usage_limit) VALUES (1, 'HAMB10', 'percent', 10, 50, 1, 100);`);

for (let i = 1; i <= 20; i++) {
  sql.push(`INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, ${50 - i * 2}, 5, 'un' FROM products WHERE id = ${i};`);
}

sql.push(`INSERT INTO expenses (restaurant_id, description, category, amount, payment_method, expense_date) VALUES (1, 'Compra de ingredientes semanal', 'ingredientes', 850, 'Pix', DATE_SUB(CURDATE(), INTERVAL 2 DAY));`);

fs.writeFileSync(path.join(__dirname, "hostinger-mysql.sql"), sql.join("\n\n"));
console.log(`Arquivo gerado: deploy/hostinger-mysql.sql (${menu.products.length} produtos)`);
