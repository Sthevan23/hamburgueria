import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", requirePermission("coupons"), async (req, res) => {
  const rid = restaurantScope(req);
  res.json(await db.prepare("SELECT * FROM coupons WHERE restaurant_id = ? ORDER BY created_at DESC").all(rid));
});

router.post("/", requirePermission("coupons"), async (req, res) => {
  const rid = restaurantScope(req);
  const { code, discount_type, discount_value, min_order = 0, start_date, end_date, usage_limit, active = 1 } = req.body;
  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }
  const result = await db.prepare(`
    INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, min_order, start_date, end_date, usage_limit, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(rid, code.toUpperCase(), discount_type, discount_value, min_order, start_date || null, end_date || null, usage_limit || null, active ? 1 : 0);
  res.status(201).json(await db.prepare("SELECT * FROM coupons WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/:id", requirePermission("coupons"), async (req, res) => {
  const rid = restaurantScope(req);
  const fields = ["code", "discount_type", "discount_value", "min_order", "start_date", "end_date", "usage_limit"];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(f === "code" ? req.body[f].toUpperCase() : req.body[f]);
    }
  }
  if (req.body.active !== undefined) { updates.push("active = ?"); values.push(req.body.active ? 1 : 0); }
  values.push(req.params.id, rid);
  await db.prepare(`UPDATE coupons SET ${updates.join(", ")} WHERE id = ? AND restaurant_id = ?`).run(...values);
  res.json(await db.prepare("SELECT * FROM coupons WHERE id = ?").get(req.params.id));
});

router.delete("/:id", requirePermission("coupons"), async (req, res) => {
  const rid = restaurantScope(req);
  await db.prepare("DELETE FROM coupons WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

export default router;
