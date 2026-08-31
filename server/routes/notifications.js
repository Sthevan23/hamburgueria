import { Router } from "express";
import db from "../db/client.js";
import { authRequired, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", async (req, res) => {
  const rid = restaurantScope(req);
  const notifications = await db.prepare(`
    SELECT * FROM notifications WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(rid);
  res.json(notifications);
});

router.patch("/read-all", async (req, res) => {
  const rid = restaurantScope(req);
  await db.prepare("UPDATE notifications SET read = 1 WHERE restaurant_id = ?").run(rid);
  res.json({ ok: true });
});

router.patch("/:id/read", async (req, res) => {
  const rid = restaurantScope(req);
  await db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

export default router;
