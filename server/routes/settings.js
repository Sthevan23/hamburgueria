import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", requirePermission("settings"), async (req, res) => {
  const rid = restaurantScope(req);
  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE id = ?").get(rid);
  const zones = await db.prepare("SELECT * FROM delivery_zones WHERE restaurant_id = ? ORDER BY name").all(rid);
  res.json({ ...restaurant, schedule: JSON.parse(restaurant.schedule_json || "{}"), zones });
});

router.put("/", requirePermission("settings"), async (req, res) => {
  const rid = restaurantScope(req);
  const fields = ["name", "logo_url", "banner_url", "phone", "whatsapp", "address", "closed_message", "min_order", "delivery_fee", "prep_time"];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (req.body.schedule) {
    updates.push("schedule_json = ?");
    values.push(JSON.stringify(req.body.schedule));
  }
  values.push(rid);
  await db.prepare(`UPDATE restaurants SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  res.json(await db.prepare("SELECT * FROM restaurants WHERE id = ?").get(rid));
});

router.post("/toggle-open", requirePermission("settings"), async (req, res) => {
  const rid = restaurantScope(req);
  const restaurant = await db.prepare("SELECT is_open FROM restaurants WHERE id = ?").get(rid);
  const newState = restaurant.is_open ? 0 : 1;
  await db.prepare("UPDATE restaurants SET is_open = ? WHERE id = ?").run(newState, rid);
  res.json({ isOpen: !!newState });
});

router.post("/zones", requirePermission("settings"), async (req, res) => {
  const rid = restaurantScope(req);
  const { name, fee = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "Nome obrigatório." });
  const result = await db.prepare(`
    INSERT INTO delivery_zones (restaurant_id, name, fee, active) VALUES (?, ?, ?, 1)
  `).run(rid, name, fee);
  res.status(201).json(await db.prepare("SELECT * FROM delivery_zones WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/zones/:id", requirePermission("settings"), async (req, res) => {
  const rid = restaurantScope(req);
  const { name, fee, active } = req.body;
  await db.prepare(`
    UPDATE delivery_zones SET name = COALESCE(?, name), fee = COALESCE(?, fee),
    active = COALESCE(?, active) WHERE id = ? AND restaurant_id = ?
  `).run(name, fee, active !== undefined ? (active ? 1 : 0) : null, req.params.id, rid);
  res.json(await db.prepare("SELECT * FROM delivery_zones WHERE id = ?").get(req.params.id));
});

router.delete("/zones/:id", requirePermission("settings"), async (req, res) => {
  const rid = restaurantScope(req);
  await db.prepare("DELETE FROM delivery_zones WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

export default router;
