import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

function stockStatus(item) {
  if (item.quantity <= 0) return "critical";
  if (item.quantity <= item.min_quantity) return "low";
  return "normal";
}

router.get("/", requirePermission("stock"), async (req, res) => {
  const rid = restaurantScope(req);
  const itemsRaw = await db.prepare("SELECT * FROM stock WHERE restaurant_id = ? ORDER BY name").all(rid);
  const items = itemsRaw.map((item) => ({ ...item, status: stockStatus(item) }));
  res.json(items);
});

router.post("/", requirePermission("stock"), async (req, res) => {
  const rid = restaurantScope(req);
  const { name, product_id, quantity = 0, min_quantity = 5, unit = "un" } = req.body;
  if (!name) return res.status(400).json({ error: "Nome obrigatório." });
  const result = await db.prepare(`
    INSERT INTO stock (restaurant_id, product_id, name, quantity, min_quantity, unit)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(rid, product_id || null, name, quantity, min_quantity, unit);
  res.status(201).json(await db.prepare("SELECT * FROM stock WHERE id = ?").get(result.lastInsertRowid));
});

router.post("/:id/movement", requirePermission("stock"), async (req, res) => {
  const rid = restaurantScope(req);
  const { type, quantity, reason } = req.body;
  const valid = ["in", "out", "adjust", "loss"];
  if (!valid.includes(type) || !quantity) return res.status(400).json({ error: "Dados inválidos." });

  const item = await db.prepare("SELECT * FROM stock WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!item) return res.status(404).json({ error: "Item não encontrado." });

  let newQty = item.quantity;
  if (type === "in") newQty += quantity;
  else if (type === "out" || type === "loss") newQty -= quantity;
  else if (type === "adjust") newQty = quantity;

  await db.prepare("UPDATE stock SET quantity = ? WHERE id = ?").run(Math.max(0, newQty), item.id);
  await db.prepare(`
    INSERT INTO stock_movements (stock_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)
  `).run(item.id, type, quantity, reason || null, req.user.id);

  const updated = await db.prepare("SELECT * FROM stock WHERE id = ?").get(item.id);
  const status = stockStatus(updated);
  if (status === "low" || status === "critical") {
    await db.prepare(`
      INSERT INTO notifications (restaurant_id, type, title, message, data_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(rid, `stock_${status}`, `Estoque ${status === "critical" ? "crítico" : "baixo"}: ${item.name}`,
      `Quantidade atual: ${updated.quantity} ${updated.unit}`, JSON.stringify({ stockId: item.id }));
  }

  res.json({ ...updated, status });
});

router.get("/:id/movements", requirePermission("stock"), async (req, res) => {
  const rid = restaurantScope(req);
  const item = await db.prepare("SELECT id FROM stock WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!item) return res.status(404).json({ error: "Item não encontrado." });
  const movements = await db.prepare(`
    SELECT sm.*, u.name as user_name FROM stock_movements sm
    LEFT JOIN users u ON u.id = sm.user_id
    WHERE sm.stock_id = ? ORDER BY sm.created_at DESC LIMIT 50
  `).all(req.params.id);
  res.json(movements);
});

export default router;
