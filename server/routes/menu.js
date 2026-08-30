import { Router } from "express";
import db from "../db/database.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

/* ---- Categories ---- */
router.get("/categories", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const categories = db
    .prepare("SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order")
    .all(rid);
  res.json(categories);
});

router.post("/categories", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const { slug, label, sort_order = 0, active = 1 } = req.body;
  if (!slug || !label) return res.status(400).json({ error: "Slug e nome são obrigatórios." });
  const result = db.prepare(`
    INSERT INTO categories (restaurant_id, slug, label, sort_order, active) VALUES (?, ?, ?, ?, ?)
  `).run(rid, slug, label, sort_order, active ? 1 : 0);
  res.status(201).json(db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/categories/:id", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const { label, slug, sort_order, active } = req.body;
  db.prepare(`
    UPDATE categories SET label = COALESCE(?, label), slug = COALESCE(?, slug),
    sort_order = COALESCE(?, sort_order), active = COALESCE(?, active)
    WHERE id = ? AND restaurant_id = ?
  `).run(label, slug, sort_order, active !== undefined ? (active ? 1 : 0) : null, req.params.id, rid);
  const cat = db.prepare("SELECT * FROM categories WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!cat) return res.status(404).json({ error: "Categoria não encontrada." });
  res.json(cat);
});

router.delete("/categories/:id", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const count = db.prepare("SELECT COUNT(*) as c FROM products WHERE category_id = ?").get(req.params.id);
  if (count.c > 0) return res.status(400).json({ error: "Categoria possui produtos vinculados." });
  db.prepare("DELETE FROM categories WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

router.put("/categories/reorder", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const { order } = req.body;
  const stmt = db.prepare("UPDATE categories SET sort_order = ? WHERE id = ? AND restaurant_id = ?");
  order.forEach((id, index) => stmt.run(index, id, rid));
  res.json({ ok: true });
});

/* ---- Products ---- */
router.get("/products", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const products = db.prepare(`
    SELECT p.*, c.label as category_label, c.slug as category_slug
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.restaurant_id = ? ORDER BY c.sort_order, p.sort_order
  `).all(rid);
  res.json(products);
});

router.post("/products", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const { category_id, slug, name, description, price, promo_price, sku, image_url, badge, prep_time, available, is_highlight, sort_order } = req.body;
  if (!category_id || !slug || !name || price === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }
  const result = db.prepare(`
    INSERT INTO products (restaurant_id, category_id, slug, name, description, price, promo_price, sku,
      image_url, badge, prep_time, available, is_highlight, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(rid, category_id, slug, name, description || "", price, promo_price || null, sku || null,
    image_url || null, badge || null, prep_time || 15, available !== false ? 1 : 0, is_highlight ? 1 : 0, sort_order || 0);
  res.status(201).json(db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/products/:id", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const fields = ["category_id", "slug", "name", "description", "price", "promo_price", "sku", "image_url", "badge", "prep_time", "sort_order"];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (req.body.available !== undefined) { updates.push("available = ?"); values.push(req.body.available ? 1 : 0); }
  if (req.body.is_highlight !== undefined) { updates.push("is_highlight = ?"); values.push(req.body.is_highlight ? 1 : 0); }
  if (!updates.length) return res.status(400).json({ error: "Nada para atualizar." });
  values.push(req.params.id, rid);
  db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ? AND restaurant_id = ?`).run(...values);
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!product) return res.status(404).json({ error: "Produto não encontrado." });
  res.json(product);
});

router.post("/products/:id/duplicate", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const original = db.prepare("SELECT * FROM products WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!original) return res.status(404).json({ error: "Produto não encontrado." });
  const newSlug = `${original.slug}-copia-${Date.now()}`;
  const result = db.prepare(`
    INSERT INTO products (restaurant_id, category_id, slug, name, description, price, promo_price, sku,
      image_url, badge, prep_time, available, is_highlight, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(rid, original.category_id, newSlug, `${original.name} (cópia)`, original.description,
    original.price, original.promo_price, original.sku, original.image_url, original.badge,
    original.prep_time, original.available, 0, original.sort_order + 1);
  res.status(201).json(db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
});

router.delete("/products/:id", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  db.prepare("DELETE FROM products WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

router.put("/products/reorder", requirePermission("menu"), (req, res) => {
  const rid = restaurantScope(req);
  const { order } = req.body;
  const stmt = db.prepare("UPDATE products SET sort_order = ? WHERE id = ? AND restaurant_id = ?");
  order.forEach((id, index) => stmt.run(index, id, rid));
  res.json({ ok: true });
});

export default router;
