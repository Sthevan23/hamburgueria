-- Burger Falcone — MySQL para Hostinger

-- Importe no phpMyAdmin: Bancos de dados > Importar

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;

DROP TABLE IF EXISTS coupons;

DROP TABLE IF EXISTS expenses;

DROP TABLE IF EXISTS stock_movements;

DROP TABLE IF EXISTS stock;

DROP TABLE IF EXISTS order_item_addons;

DROP TABLE IF EXISTS order_items;

DROP TABLE IF EXISTS orders;

DROP TABLE IF EXISTS payment_methods;

DROP TABLE IF EXISTS delivery_zones;

DROP TABLE IF EXISTS addresses;

DROP TABLE IF EXISTS customers;

DROP TABLE IF EXISTS product_addon_groups;

DROP TABLE IF EXISTS addons;

DROP TABLE IF EXISTS addon_groups;

DROP TABLE IF EXISTS products;

DROP TABLE IF EXISTS categories;

DROP TABLE IF EXISTS users;

DROP TABLE IF EXISTS restaurants;

SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT, banner_url TEXT, phone VARCHAR(50), whatsapp VARCHAR(30), address TEXT,
  is_open TINYINT(1) DEFAULT 1,
  closed_message TEXT DEFAULT 'Estamos fechados no momento. Volte em breve!',
  min_order DECIMAL(10,2) DEFAULT 0, delivery_fee DECIMAL(10,2) DEFAULT 0, prep_time INT DEFAULT 30,
  schedule_json JSON, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', permissions_json JSON, active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, slug VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL, sort_order INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_restaurant_slug (restaurant_id, slug),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, category_id INT NOT NULL,
  slug VARCHAR(150) NOT NULL, name VARCHAR(255) NOT NULL, description TEXT,
  price DECIMAL(10,2) NOT NULL, promo_price DECIMAL(10,2), sku VARCHAR(100), image_url TEXT,
  badge VARCHAR(100), prep_time INT DEFAULT 15, is_highlight TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0, available TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_restaurant_product_slug (restaurant_id, slug),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE addon_groups (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  min_qty INT DEFAULT 0, max_qty INT DEFAULT 10, required TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE addons (
  id INT AUTO_INCREMENT PRIMARY KEY, group_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0, sort_order INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_addon_groups (
  product_id INT NOT NULL, group_id INT NOT NULL, PRIMARY KEY (product_id, group_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES addon_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  phone VARCHAR(30), email VARCHAR(255), total_orders INT DEFAULT 0, total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, street VARCHAR(255), number VARCHAR(20),
  complement VARCHAR(255), neighborhood VARCHAR(255), city VARCHAR(255), is_default TINYINT(1) DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE delivery_zones (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(255) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0, active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL, active TINYINT(1) DEFAULT 1, sort_order INT DEFAULT 0,
  UNIQUE KEY uq_restaurant_payment (restaurant_id, slug),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, customer_id INT, order_number INT NOT NULL,
  status VARCHAR(30) DEFAULT 'new', type VARCHAR(20) DEFAULT 'delivery',
  customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(30), address_text TEXT,
  payment_method VARCHAR(100), notes TEXT, subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0, discount DECIMAL(10,2) DEFAULT 0, total DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(50), created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  accepted_at DATETIME, completed_at DATETIME,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id), FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, product_id INT, product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL, unit_price DECIMAL(10,2) NOT NULL, total_price DECIMAL(10,2) NOT NULL, notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_item_addons (
  id INT AUTO_INCREMENT PRIMARY KEY, order_item_id INT NOT NULL, addon_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE stock (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, product_id INT, name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0, min_quantity DECIMAL(10,2) DEFAULT 5, unit VARCHAR(20) DEFAULT 'un',
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id), FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY, stock_id INT NOT NULL, type VARCHAR(20) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, reason TEXT, user_id INT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, amount DECIMAL(10,2) NOT NULL, payment_method VARCHAR(100),
  notes TEXT, expense_date DATE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL, discount_value DECIMAL(10,2) NOT NULL, min_order DECIMAL(10,2) DEFAULT 0,
  start_date DATE, end_date DATE, usage_limit INT, used_count INT DEFAULT 0, active TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_restaurant_coupon (restaurant_id, code),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY, restaurant_id INT NOT NULL, user_id INT, type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL, message TEXT, `read` TINYINT(1) DEFAULT 0, data_json JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);

CREATE INDEX idx_orders_status ON orders(status);

CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_products_category ON products(category_id);

CREATE INDEX idx_customers_phone ON customers(phone);


INSERT INTO restaurants (name, slug, whatsapp, banner_url, phone, address, is_open, min_order, delivery_fee, prep_time, schedule_json) VALUES (
  'Burger Falcone', 'burger-falcone', '5500000000000',
  'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1400&q=80',
  '(00) 00000-0000', 'Rua Exemplo, 123 - Centro', 1, 25, 5, 30,
  '{"days":[0,2,3,4,5,6],"open":"18:00","close":"23:30"}'
);

INSERT INTO users (restaurant_id, name, email, password_hash, role) VALUES
(1, 'Administrador', 'admin@burgerfalcone.com', '$2a$10$SueY5b9SD/ZVYkSrn/cmYe/0XTXpMj52p9ijHIynt4s7YpPmQW.Uq', 'admin'),
(1, 'Cozinha', 'cozinha@burgerfalcone.com', '$2a$10$SueY5b9SD/ZVYkSrn/cmYe/0XTXpMj52p9ijHIynt4s7YpPmQW.Uq', 'kitchen');

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'smash', 'Smash', 0, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'artesanais', 'Artesanais', 1, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'tradicionais', 'Tradicionais', 2, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'porcoes', 'Porções', 3, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'omeletes', 'Omeletes', 4, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'bebidas', 'Bebidas', 5, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'cervejas', 'Cervejas', 6, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'doses', 'Doses', 7, 1);

INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (1, 'adicionais', 'Adicionais', 8, 1);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 1, 'smash-burguer', 'Smash Burguer', 'Pão brioche, alface, tomate, bife smash, 2 fatias de cheddar, barbecue e cebola roxa.', 22, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 1, 'smash-bacon', 'Smash Bacon', 'Pão brioche, alface, tomate, bife smash, bacon, 2 fatias de cheddar, barbecue e cebola roxa.', 26, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=700&q=80', 'Popular', 1, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 1, 'duplo-smash', 'Duplo Smash', 'Pão brioche, alface, tomate, 2 bifes smash, bacon em dobro, 4 fatias de cheddar, barbecue e cebola roxa.', 30, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 1, 'falcone-smash', 'Falcone Smash', 'Pão brioche, alface, tomate, 2 bifes smash, 2 ovos, bacon em dobro, frango empanado, 4 fatias de cheddar, barbecue e cebola roxa.', 34, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=700&q=80', 'Destaque', 1, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'x-artesanal', 'X Artesanal', 'Pão brioche, alface, tomate, milho, batata, bife artesanal, presunto e muçarela.', 22, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'x-artesanal-egg', 'X Artesanal Egg', 'Pão brioche, alface, tomate, milho, batata, bife artesanal, presunto, ovo e muçarela.', 24, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'x-artesanal-egg-bacon', 'X Artesanal Egg Bacon', 'Pão brioche, alface, tomate, milho, batata, bife artesanal, presunto, ovo, bacon e muçarela.', 26, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'x-duplo-artesanal', 'X Duplo Artesanal', 'Pão brioche, alface, tomate, milho, batata, 2 bifes artesanais, presunto e muçarela.', 26, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'oreo', 'Oreo', 'Pão brioche, alface, tomate, cebola roxa, 2 bifes artesanais, 2 fatias de muçarela e bacon.', 28, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'sparta', 'Sparta', 'Pão brioche, alface, tomate, 2 bifes artesanais e 2 fatias de muçarela.', 25, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'saturno', 'Saturno', 'Pão brioche, alface, tomate, 3 bifes artesanais e 2 fatias de muçarela.', 30, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'taz-mania', 'Taz Mania', 'Pão brioche, 2 bifes artesanais, 2 fatias de tomate, cebola roxa, bacon, frango e cheddar.', 30, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'patolino', 'Patolino', 'Pão brioche, bife artesanal, bacon, tomate, cebola roxa e cheddar.', 25, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'jerry', 'Jerry', 'Pão brioche, frango empanado, 2 fatias de tomate, cebola roxa e cheddar.', 26, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'frajola', 'Frajola', 'Pão brioche, bife artesanal, 2 fatias de tomate, cebola roxa, batata chips e cheddar.', 26, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 11, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'galaxias', 'Galáxias', 'Pão brioche, alface, tomate, bife artesanal, frango empanado, ovo, muçarela, bacon, cheddar e cebola roxa.', 32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', 'Premium', 1, 12, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'falcone-peixe', 'Falcone Peixe', 'Pão brioche, alface, tomate, cebola, ovo, muçarela e filé de tilápia.', 32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 13, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'falcone-caramelo', 'Falcone Caramelo', 'Pão brioche, alface, tomate, bife artesanal, muçarela e cebola caramelizada.', 27, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 14, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'mega', 'Mega', 'Pão brioche, alface, tomate, 2 bifes artesanais, muçarela e ovo.', 26, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 15, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'cinderela', 'Cinderela', 'Pão brioche, bife artesanal, muçarela, presunto, cebola roxa e 2 fatias de tomate.', 24, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 16, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'bumblebee', 'Bumblebee', 'Pão brioche, bife artesanal, alface, tomate, cebola roxa, 2 fatias de muçarela e bacon.', 27, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 17, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'megatron', 'Megatron', 'Pão brioche, tomate, cebola roxa, bife artesanal, frango empanado, cheddar e bacon.', 32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 18, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'optimus-prime', 'Optimus Prime', 'Pão brioche, alface, tomate, 2 bifes artesanais, bacon, cebola roxa, cheddar e muçarela.', 30, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 19, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'meteoro', 'Meteoro', 'Pão brioche, alface, tomate, cebola roxa, bife artesanal, frango empanado e cheddar.', 28, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 20, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'double', 'Double', 'Pão brioche, alface, tomate, cebola roxa, cheddar e 2 bifes artesanais.', 28, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 21, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'mec-lanche', 'Mec Lanche', 'Pão brioche, alface, tomate, presunto, muçarela, bacon, ovo, frango e bife artesanal.', 28, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 22, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'novo-sanduiche-casa', 'Novo Sanduíche da Casa', 'Pão brioche, 2 bifes artesanais, 2 fatias de cheddar, alface, tomate e cebola empanada.', 32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', 'Novo', 0, 23, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'sanduiche-china', 'Sanduíche China', 'Pão brioche, cheddar, bife artesanal, bacon, alface, tomate e cebola roxa.', 32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 24, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'sanduiche-falcone', 'Sanduíche Falcone', 'Pão brioche, 3 fatias de cheddar, 3 ovos, 3 bifes artesanais, alface, tomate e cebola roxa.', 44, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', 'Top', 1, 25, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 2, 'sanduiche-bobo-bi', 'Sanduíche Bobo Bi', 'Pão brioche, bife artesanal, cheddar, ovo, bacon e muçarela empanada.', 32, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', NULL, 0, 26, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'misto', 'Misto', 'Pão, 2 fatias de presunto e 2 fatias de muçarela.', 14, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'misto-ovo', 'Misto com Ovo', 'Pão, 2 fatias de presunto, 2 fatias de muçarela e ovo.', 15, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'misto-bacon', 'Misto com Bacon', 'Pão, 2 fatias de presunto, 2 fatias de muçarela e bacon.', 17, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'americano', 'Americano', 'Pão de forma, bife, presunto, muçarela, ovo, alface, tomate, milho e batata palha.', 18, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'bauru', 'Bauru', 'Pão de forma, ovo, 2 fatias de presunto, 2 fatias de muçarela, alface, tomate, milho e batata palha.', 16, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'quaresma', 'Quaresma', 'Pão, ovo, 2 fatias de muçarela, alface, tomate, milho e batata palha.', 16, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'hamburguer', 'Hambúrguer', 'Pão, bife, alface, tomate, milho e batata palha.', 15, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'hamburguer-ovo', 'Hambúrguer com Ovo', 'Pão, bife, ovo, alface, tomate, milho e batata palha.', 17, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'hamburgao', 'Hamburgão', 'Pão, 2 bifes, alface, tomate, milho e batata palha.', 17, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-salada', 'X Salada', 'Pão, alface, tomate, 2 fatias de presunto, 2 fatias de muçarela, milho e batata palha.', 15, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-burguer', 'X Burguer', 'Pão, bife, presunto, muçarela, alface, tomate, milho e batata palha.', 17, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 11, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-egg', 'X Egg', 'Pão, bife, presunto, muçarela, ovo, alface, tomate, milho e batata palha.', 18, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 12, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-duplo', 'X Duplo', 'Pão, 2 bifes, presunto, muçarela, alface, tomate, milho e batata palha.', 19, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 13, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-frango', 'X Frango', 'Pão, bife, frango, presunto, muçarela, alface, tomate, milho e batata palha.', 21, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 14, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-bacon', 'X Bacon', 'Pão, bife, bacon, presunto, muçarela, alface, tomate, milho e batata palha.', 21, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 15, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'triplo-x', 'Triplo X', 'Pão, alface, tomate, milho, batata, bife e 3 fatias de muçarela.', 18, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 16, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-egg-bacon', 'X Egg Bacon', 'Pão, bife, ovo, bacon, presunto, muçarela, alface, tomate, milho e batata palha.', 23, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 17, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-egg-frango', 'X Egg Frango', 'Pão, frango, bife, ovo, presunto, muçarela, alface, tomate, milho e batata palha.', 23, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 18, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-frango-bacon-especial', 'X Frango com Bacon Especial', 'Pão, bife, alface, tomate, milho, batata, frango, presunto, bacon e muçarela.', 24, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 19, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-calabresa', 'X Calabresa', 'Pão, alface, tomate, milho, batata, bife, presunto, calabresa e muçarela.', 22, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 20, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-egg-calabresa', 'X Egg Calabresa', 'Pão, alface, tomate, milho, batata, bife, ovo, presunto, calabresa e muçarela.', 23, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 21, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-calabresa-egg-bacon', 'X Calabresa Egg Bacon', 'Pão, alface, tomate, milho, batata, presunto, ovo, bife, bacon, calabresa e muçarela.', 25, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 22, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-tudo', 'X Tudo', 'Pão, bife, ovo, bacon, frango, presunto, muçarela, alface, tomate, milho e batata palha.', 25, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', 'Clássico', 1, 23, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-picanha', 'X Picanha', 'Pão, bife de picanha, presunto, muçarela, alface, tomate, milho e batata palha.', 21, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 24, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-picanha-egg', 'X Picanha Egg', 'Pão, bife de picanha, ovo, presunto, muçarela, alface, tomate, milho e batata palha.', 23, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 25, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-picanha-egg-bacon', 'X Picanha Egg Bacon', 'Pão, bife de picanha, bacon, ovo, presunto, muçarela, alface, tomate, milho e batata palha.', 25, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 26, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'x-egg-picanha-frango', 'X Egg Picanha Frango', 'Pão, alface, tomate, milho, batata, bife de picanha 120g, presunto, ovo, frango e muçarela.', 25, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 27, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'falcone-especial', 'Burger Falcone', 'Pão, 2 bifes, 2 ovos, frango, bacon, presunto, muçarela, alface, tomate, milho e batata palha.', 28, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', 'Da casa', 0, 28, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'falcone-prato', 'Burger Falcone no Prato', 'Pão, 2 bifes, 2 ovos, frango, bacon, presunto, muçarela, alface, tomate, milho e batata palha.', 28, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', NULL, 0, 29, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 3, 'novidade-marmitex', 'Novidade Marmitex', 'Pão, alface, tomate, milho, batata, 2 bifes, ovo, presunto, bacon, frango, abacaxi, banana, calabresa e muçarela.', 32, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80', 'Novo', 0, 30, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'contra-file-fritas', 'Contra Filé c/ Fritas', 'Porção de contra filé com batata frita.', 70, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'contra-file-sem-fritas', 'Contra Filé s/ Fritas', 'Porção de contra filé sem batata.', 60, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'tilapia-fritas', 'Filé de Tilápia c/ Fritas', 'Filé de tilápia com batata frita.', 70, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'tilapia-sem-fritas', 'Filé de Tilápia s/ Fritas', 'Filé de tilápia sem batata.', 60, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'batata-completa', 'Batata Completa', 'Batata completa com acompanhamentos.', 35, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80', NULL, 1, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'batata-simples', 'Batata Simples', 'Porção de batata frita simples.', 30, 'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'frango-passarinho-fritas', 'Frango à Passarinho c/ Fritas', 'Frango à passarinho com batata frita.', 60, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'frango-passarinho-sem-fritas', 'Frango à Passarinho s/ Fritas', 'Frango à passarinho sem batata.', 40, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'porcao-bife-artesanal', 'Porção de Bife Artesanal', 'Porção de bife artesanal.', 40, 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'macarrao-chapa', 'Macarrão na Chapa', 'Bacon, frango, cebola, tomate, calabresa, sazón, muçarela e milho.', 26, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'batata-simples-individual', 'Batata Simples (Individual)', 'Porção individual de batata simples.', 10, 'https://images.unsplash.com/photo-1630431341973-02e1b662ec35?auto=format&fit=crop&w=700&q=80', NULL, 0, 11, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 4, 'batata-completa-individual', 'Batata Completa (Individual)', 'Porção individual de batata completa.', 13, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80', NULL, 0, 12, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-simples-m', 'Omelete Simples (M)', 'Ovo, cebola, catupiry, presunto, muçarela, milho, tomate e batata palha.', 18, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-simples-g', 'Omelete Simples (G)', 'Ovo, cebola, catupiry, presunto, muçarela, milho, tomate e batata palha.', 24, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-bacon-m', 'Omelete de Bacon (M)', 'Ovo, cebola, catupiry, presunto, muçarela, bacon, milho, tomate e batata palha.', 22, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-bacon-g', 'Omelete de Bacon (G)', 'Ovo, cebola, catupiry, presunto, muçarela, bacon, milho, tomate e batata palha.', 30, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-frango-m', 'Omelete de Frango (M)', 'Ovo, cebola, catupiry, presunto, muçarela, frango, milho, tomate e batata palha.', 22, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-frango-g', 'Omelete de Frango (G)', 'Ovo, cebola, catupiry, presunto, muçarela, frango, milho, tomate e batata palha.', 30, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-completo-m', 'Omelete Completo (M)', 'Ovo, cebola, catupiry, presunto, muçarela, frango, bacon, milho, tomate e batata palha.', 22, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-completo-g', 'Omelete Completo (G)', 'Ovo, cebola, catupiry, presunto, muçarela, frango, bacon, milho, tomate e batata palha.', 30, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-calabresa-m', 'Omelete Calabresa (M)', 'Ovo, cebola, presunto, muçarela, calabresa, catupiry, tomate, milho e batata palha.', 22, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 5, 'omelete-calabresa-g', 'Omelete Calabresa (G)', 'Ovo, cebola, presunto, muçarela, calabresa, catupiry, tomate, milho e batata palha.', 30, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'coca-2l', 'Coca-Cola 2 Litros', 'Refrigerante Coca-Cola 2 litros.', 20, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'sprite-2l', 'Sprite 2 Litros', 'Refrigerante Sprite 2 litros.', 17, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'guarana-2l', 'Guaraná 2 Litros', 'Refrigerante Guaraná 2 litros.', 17, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'fanta-2l', 'Fanta 2 Litros', 'Refrigerante Fanta 2 litros.', 17, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'mineiro-2l', 'Mineiro 2 Litros', 'Refrigerante Mineiro 2 litros.', 17, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'mineirinho-15l', 'Mineirinho 1,5 Litro', 'Refrigerante Mineirinho 1,5 litro.', 15, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'guarana-1l', 'Guaraná 1 Litro', 'Refrigerante Guaraná 1 litro.', 12, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'coca-600', 'Coca-Cola 600 ml', 'Refrigerante Coca-Cola 600 ml.', 10, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'fanta-600', 'Fanta 600 ml', 'Refrigerante Fanta 600 ml.', 10, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'sprite-600', 'Sprite 600 ml', 'Refrigerante Sprite 600 ml.', 10, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'mineirinho-600', 'Mineirinho 600 ml', 'Refrigerante Mineirinho 600 ml.', 10, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 11, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'coca-lata', 'Coca-Cola Lata', 'Refrigerante Coca-Cola em lata.', 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 12, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'fanta-lata', 'Fanta Lata', 'Refrigerante Fanta em lata.', 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 13, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'sprite-lata', 'Sprite Lata', 'Refrigerante Sprite em lata.', 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 14, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'guarana-lata', 'Guaraná Lata', 'Refrigerante Guaraná em lata.', 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 15, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'coca-200', 'Coca-Cola 200 ml', 'Refrigerante Coca-Cola 200 ml.', 4, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 16, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'guarana-200', 'Guaraná 200 ml', 'Refrigerante Guaraná 200 ml.', 4, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 17, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'mineirinho-200', 'Mineirinho 200 ml', 'Refrigerante Mineirinho 200 ml.', 4, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 18, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'agua-sem-gas', 'Água 500 ml s/ Gás', 'Água mineral sem gás 500 ml.', 4, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 19, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'agua-com-gas', 'Água 500 ml c/ Gás', 'Água mineral com gás 500 ml.', 5, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 20, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'h2o-500', 'H2O 500 ml', 'Bebida H2O 500 ml.', 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 21, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'delvalle-lata', 'Del Valle Lata', 'Suco Del Valle em lata.', 8, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 22, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'delvalle-1l', 'Del Valle 1 Litro', 'Suco Del Valle 1 litro.', 12, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 23, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'energetico-2l', 'Energético 2 Litros', 'Energético 2 litros.', 15, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 24, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'monster-latao', 'Monster Latão', 'Energético Monster latão.', 15, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 25, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 6, 'red-bull', 'Red Bull', 'Energético Red Bull.', 15, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80', NULL, 0, 26, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'heineken-600', 'Heineken 600 ml', 'Cerveja Heineken 600 ml.', 17, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'stella-600', 'Stella 600 ml', 'Cerveja Stella Artois 600 ml.', 17, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'spaten-600', 'Spaten 600 ml', 'Cerveja Spaten 600 ml.', 17, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'brahma-600', 'Brahma 600 ml', 'Cerveja Brahma 600 ml.', 14, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'boa-600', 'Boa 600 ml', 'Cerveja Boa 600 ml.', 14, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'skol-600', 'Skol 600 ml', 'Cerveja Skol 600 ml.', 14, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'heineken-473', 'Heineken 473 ml', 'Cerveja Heineken 473 ml.', 12, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'skol-473', 'Skol 473 ml', 'Cerveja Skol 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'brahma-473', 'Brahma 473 ml', 'Cerveja Brahma 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'boa-473', 'Boa 473 ml', 'Cerveja Boa 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'kaiser-473', 'Kaiser 473 ml', 'Cerveja Kaiser 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 11, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'subzero-473', 'Sub Zero 473 ml', 'Cerveja Sub Zero 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 12, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'amstel-473', 'Amstel 473 ml', 'Cerveja Amstel 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 13, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'petra-473', 'Petra 473 ml', 'Cerveja Petra 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 14, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'budweiser-473', 'Budweiser 473 ml', 'Cerveja Budweiser 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 15, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'spaten-473', 'Spaten 473 ml', 'Cerveja Spaten 473 ml.', 10, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 16, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 7, 'litrinho', 'Litrinho', 'Skol, Brahma, Boa ou Império — informe o sabor nas observações.', 5, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80', NULL, 0, 17, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'chop-vinho-litro', 'Chop Vinho Litro', 'Chop de vinho — litro.', 15, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'pergola-litro', 'Pérgola Litro', 'Vinho Pérgola — litro.', 36, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'pergola-copo', 'Pérgola Copo', 'Vinho Pérgola — copo.', 7, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'cancao-litro', 'Canção Vinho Litro', 'Vinho Canção — litro.', 25, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'cancao-copo', 'Canção Vinho Copo', 'Vinho Canção — copo.', 5, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'catuaba-litro', 'Catuaba Litro', 'Catuaba — litro.', 30, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'catuaba-copo', 'Catuaba Copo', 'Catuaba — copo.', 5, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 8, 'conhaque-dose', 'Conhaque Dose', 'Dose de conhaque.', 5, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-cheddar', 'Cheddar', 'Adicional de cheddar.', 3, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 1, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-cheddar-cremoso', 'Cheddar Cremoso', 'Adicional de cheddar cremoso.', 2, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 2, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-catupiry', 'Catupiry', 'Adicional de catupiry.', 2, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 3, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-ovo', 'Ovo', 'Adicional de ovo.', 3, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 4, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-bife-tradicional', 'Bife Tradicional', 'Adicional de bife tradicional.', 4, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 5, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-bife-artesanal', 'Bife Artesanal', 'Adicional de bife artesanal.', 7, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 6, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-bife-smash', 'Bife Smash', 'Adicional de bife smash.', 7, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 7, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-bife-picanha', 'Bife Picanha', 'Adicional de bife de picanha.', 7, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 8, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-bacon', 'Bacon', 'Adicional de bacon.', 4, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 9, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-frango', 'Frango', 'Adicional de frango.', 4, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 10, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-frango-empanado', 'Frango Empanado', 'Adicional de frango empanado.', 7, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 11, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-presunto-mucarela', 'Presunto e Muçarela', 'Adicional de presunto e muçarela.', 3, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 12, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-mucarela-empanada', 'Muçarela Empanada', 'Adicional de muçarela empanada.', 7, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 13, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-cebola-empanada', 'Cebola Empanada', 'Adicional de cebola empanada.', 5, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 14, 1, 15);

INSERT INTO products (restaurant_id, category_id, slug, name, description, price, image_url, badge, is_highlight, sort_order, available, prep_time) VALUES (1, 9, 'add-cebola-roxa', 'Cebola Roxa', 'Adicional de cebola roxa.', 3, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80', NULL, 0, 15, 1, 15);

INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order) VALUES (1, 'Pix', 'pix', 1, 0);

INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order) VALUES (1, 'Dinheiro', 'dinheiro', 1, 1);

INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order) VALUES (1, 'Cartão de Crédito', 'cartao-credito', 1, 2);

INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order) VALUES (1, 'Cartão de Débito', 'cartao-debito', 1, 3);

INSERT INTO payment_methods (restaurant_id, name, slug, active, sort_order) VALUES (1, 'Vale-refeição', 'vale-refeicao', 1, 4);

INSERT INTO addon_groups (id, restaurant_id, name, min_qty, max_qty, required, sort_order, active) VALUES
(1, 1, 'Escolha seu queijo', 0, 1, 0, 0, 1), (2, 1, 'Adicionais', 0, 10, 0, 1, 1);

INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (1, 'Cheddar', 3, 0, 1);

INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (1, 'Mussarela', 2.5, 1, 1);

INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (1, 'Gorgonzola', 4, 2, 1);

INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (2, 'Bacon', 5, 0, 1);

INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (2, 'Ovo', 2, 1, 1);

INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (2, 'Cebola caramelizada', 3, 2, 1);

INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (1, 'Centro', 5, 1);

INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (1, 'Jardim', 7, 1);

INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (1, 'Vila Nova', 8, 1);

INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (1, 'Bairro Industrial', 10, 1);

INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, min_order, active, usage_limit) VALUES (1, 'HAMB10', 'percent', 10, 50, 1, 100);

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 48, 5, 'un' FROM products WHERE id = 1;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 46, 5, 'un' FROM products WHERE id = 2;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 44, 5, 'un' FROM products WHERE id = 3;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 42, 5, 'un' FROM products WHERE id = 4;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 40, 5, 'un' FROM products WHERE id = 5;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 38, 5, 'un' FROM products WHERE id = 6;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 36, 5, 'un' FROM products WHERE id = 7;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 34, 5, 'un' FROM products WHERE id = 8;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 32, 5, 'un' FROM products WHERE id = 9;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 30, 5, 'un' FROM products WHERE id = 10;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 28, 5, 'un' FROM products WHERE id = 11;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 26, 5, 'un' FROM products WHERE id = 12;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 24, 5, 'un' FROM products WHERE id = 13;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 22, 5, 'un' FROM products WHERE id = 14;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 20, 5, 'un' FROM products WHERE id = 15;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 18, 5, 'un' FROM products WHERE id = 16;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 16, 5, 'un' FROM products WHERE id = 17;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 14, 5, 'un' FROM products WHERE id = 18;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 12, 5, 'un' FROM products WHERE id = 19;

INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit) SELECT 1, id, name, 10, 5, 'un' FROM products WHERE id = 20;

INSERT INTO expenses (restaurant_id, description, category, amount, payment_method, expense_date) VALUES (1, 'Compra de ingredientes semanal', 'ingredientes', 850, 'Pix', DATE_SUB(CURDATE(), INTERVAL 2 DAY));