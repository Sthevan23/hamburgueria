import { Router } from "express";
import db from "../db/database.js";
import { authRequired, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", (req, res) => {
  const rid = restaurantScope(req);
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(rid);
  res.json(notifications);
});

router.patch("/read-all", (req, res) => {
  const rid = restaurantScope(req);
  db.prepare("UPDATE notifications SET read = 1 WHERE restaurant_id = ?").run(rid);
  res.json({ ok: true });
});

router.patch("/:id/read", (req, res) => {
  const rid = restaurantScope(req);
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

export default router;
