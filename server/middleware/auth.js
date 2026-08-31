import jwt from "jsonwebtoken";
import db from "../db/client.js";

const JWT_SECRET = process.env.JWT_SECRET || "burger-falcone-secret-change-in-production";
const JWT_EXPIRES = "7d";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, restaurantId: user.restaurant_id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  try {
    const payload = verifyToken(header.slice(7));
    const user = await db.prepare("SELECT * FROM users WHERE id = ? AND active = 1").get(payload.id);
    if (!user) return res.status(401).json({ error: "Usuário inválido." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Sessão expirada." });
  }
}

const ROLE_PERMISSIONS = {
  admin: ["*"],
  manager: ["dashboard", "orders", "menu", "addons", "stock", "finance", "customers", "coupons", "reports", "settings", "kitchen", "notifications"],
  attendant: ["orders", "customers", "notifications"],
  kitchen: ["kitchen", "orders"],
};

export function requirePermission(...permissions) {
  return (req, res, next) => {
    const rolePerms = ROLE_PERMISSIONS[req.user.role] || [];
    if (rolePerms.includes("*") || permissions.some((p) => rolePerms.includes(p))) {
      return next();
    }
    return res.status(403).json({ error: "Sem permissão." });
  };
}

export function restaurantScope(req) {
  return req.user.restaurant_id;
}
