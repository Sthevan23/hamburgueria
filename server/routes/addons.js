import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/groups", requirePermission("addons"), async (req, res) => {
  const rid = restaurantScope(req);
  const groupsRaw = await db
    .prepare("SELECT * FROM addon_groups WHERE restaurant_id = ? ORDER BY sort_order")
    .all(rid);
  const groups = [];
  for (const g of groupsRaw) {
    const addons = await db.prepare("SELECT * FROM addons WHERE group_id = ? ORDER BY sort_order").all(g.id);
    groups.push({
      ...g,
      required: !!g.required,
      addons,
    });
  }
  res.json(groups);
});

router.post("/groups", requirePermission("addons"), async (req, res) => {
  const rid = restaurantScope(req);
  const { name, min_qty = 0, max_qty = 10, required = 0, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "Nome obrigatório." });
  const result = await db.prepare(`
    INSERT INTO addon_groups (restaurant_id, name, min_qty, max_qty, required, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(rid, name, min_qty, max_qty, required ? 1 : 0, sort_order);
  res.status(201).json(await db.prepare("SELECT * FROM addon_groups WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/groups/:id", requirePermission("addons"), async (req, res) => {
  const rid = restaurantScope(req);
  const { name, min_qty, max_qty, required, active, sort_order } = req.body;
  await db.prepare(`
    UPDATE addon_groups SET name = COALESCE(?, name), min_qty = COALESCE(?, min_qty),
    max_qty = COALESCE(?, max_qty), required = COALESCE(?, required),
    active = COALESCE(?, active), sort_order = COALESCE(?, sort_order)
    WHERE id = ? AND restaurant_id = ?
  `).run(name, min_qty, max_qty, required !== undefined ? (required ? 1 : 0) : null,
    active !== undefined ? (active ? 1 : 0) : null, sort_order, req.params.id, rid);
  res.json(await db.prepare("SELECT * FROM addon_groups WHERE id = ?").get(req.params.id));
});

router.delete("/groups/:id", requirePermission("addons"), async (req, res) => {
  const rid = restaurantScope(req);
  await db.prepare("DELETE FROM addon_groups WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

router.post("/groups/:groupId/items", requirePermission("addons"), async (req, res) => {
  const { name, price = 0, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "Nome obrigatório." });
  const result = await db.prepare(`
    INSERT INTO addons (group_id, name, price, sort_order, active) VALUES (?, ?, ?, ?, 1)
  `).run(req.params.groupId, name, price, sort_order);
  res.status(201).json(await db.prepare("SELECT * FROM addons WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/items/:id", requirePermission("addons"), async (req, res) => {
  const { name, price, active, sort_order } = req.body;
  await db.prepare(`
    UPDATE addons SET name = COALESCE(?, name), price = COALESCE(?, price),
    active = COALESCE(?, active), sort_order = COALESCE(?, sort_order) WHERE id = ?
  `).run(name, price, active !== undefined ? (active ? 1 : 0) : null, sort_order, req.params.id);
  res.json(await db.prepare("SELECT * FROM addons WHERE id = ?").get(req.params.id));
});

router.delete("/items/:id", requirePermission("addons"), async (req, res) => {
  await db.prepare("DELETE FROM addons WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
