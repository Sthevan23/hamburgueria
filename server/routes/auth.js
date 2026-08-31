import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db/client.js";
import { signToken, verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  const user = await db.prepare("SELECT * FROM users WHERE email = ? AND active = 1").get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE id = ?").get(user.restaurant_id);
  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    },
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      isOpen: !!restaurant.is_open,
    },
  });
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autenticado." });
  try {
    const payload = verifyToken(header.slice(7));
    const user = await db.prepare("SELECT id, name, email, role, restaurant_id FROM users WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ error: "Usuário inválido." });
    const restaurant = await db.prepare("SELECT id, name, is_open FROM restaurants WHERE id = ?").get(user.restaurant_id);
    res.json({ user: { ...user, restaurantId: user.restaurant_id }, restaurant: { ...restaurant, isOpen: !!restaurant.is_open } });
  } catch {
    res.status(401).json({ error: "Sessão expirada." });
  }
});

export default router;
