import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", requirePermission("customers"), async (req, res) => {
  const rid = restaurantScope(req);
  const customers = await db.prepare(`
    SELECT * FROM customers WHERE restaurant_id = ? ORDER BY total_spent DESC
  `).all(rid);
  res.json(customers);
});

router.get("/ranking", requirePermission("customers"), async (req, res) => {
  const rid = restaurantScope(req);
  const ranking = await db.prepare(`
    SELECT id, name, phone, total_orders, total_spent, last_order_at
    FROM customers WHERE restaurant_id = ? ORDER BY total_spent DESC LIMIT 10
  `).all(rid);
  res.json(ranking);
});

router.get("/:id", requirePermission("customers"), async (req, res) => {
  const rid = restaurantScope(req);
  const customer = await db.prepare("SELECT * FROM customers WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!customer) return res.status(404).json({ error: "Cliente não encontrado." });
  const addresses = await db.prepare("SELECT * FROM addresses WHERE customer_id = ?").all(customer.id);
  const orders = await db.prepare(`
    SELECT id, order_number, total, status, payment_method, created_at
    FROM orders WHERE customer_id = ? ORDER BY created_at DESC
  `).all(customer.id);
  res.json({ ...customer, addresses, orders });
});

export default router;
