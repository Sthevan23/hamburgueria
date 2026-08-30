import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db/database.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", requirePermission("settings"), (req, res) => {
  const rid = restaurantScope(req);
  const users = db.prepare("SELECT id, name, email, role, active, created_at FROM users WHERE restaurant_id = ?").all(rid);
  res.json(users);
});

router.post("/", requirePermission("settings"), (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Apenas administradores." });
  const rid = restaurantScope(req);
  const { name, email, password, role = "attendant" } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Campos obrigatórios." });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(`
      INSERT INTO users (restaurant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)
    `).run(rid, name, email.toLowerCase(), hash, role);
    res.status(201).json(db.prepare("SELECT id, name, email, role, active FROM users WHERE id = ?").get(result.lastInsertRowid));
  } catch {
    res.status(400).json({ error: "E-mail já cadastrado." });
  }
});

router.put("/:id", requirePermission("settings"), (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Apenas administradores." });
  const rid = restaurantScope(req);
  const { name, role, active, password } = req.body;
  if (name) db.prepare("UPDATE users SET name = ? WHERE id = ? AND restaurant_id = ?").run(name, req.params.id, rid);
  if (role) db.prepare("UPDATE users SET role = ? WHERE id = ? AND restaurant_id = ?").run(role, req.params.id, rid);
  if (active !== undefined) db.prepare("UPDATE users SET active = ? WHERE id = ? AND restaurant_id = ?").run(active ? 1 : 0, req.params.id, rid);
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND restaurant_id = ?").run(hash, req.params.id, rid);
  }
  res.json(db.prepare("SELECT id, name, email, role, active FROM users WHERE id = ?").get(req.params.id));
});

export default router;
