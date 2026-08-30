import { Router } from "express";
import db from "../db/database.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/dashboard", requirePermission("finance"), (req, res) => {
  const rid = restaurantScope(req);
  const period = req.query.period || "30d";
  const orderClause = period === "7d" ? ">= datetime('now', '-7 days')" : ">= datetime('now', '-30 days')";
  const expenseClause = period === "7d" ? ">= date('now', '-7 days')" : ">= date('now', '-30 days')";

  const revenue = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total FROM orders
    WHERE restaurant_id = ? AND status != 'cancelled' AND created_at ${orderClause}
  `).get(rid);

  const expenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    WHERE restaurant_id = ? AND expense_date ${expenseClause}
  `).get(rid);

  const avgTicket = db.prepare(`
    SELECT COALESCE(AVG(total), 0) as avg FROM orders
    WHERE restaurant_id = ? AND status != 'cancelled' AND created_at ${orderClause}
  `).get(rid);

  const byCategory = db.prepare(`
    SELECT category, SUM(amount) as total FROM expenses
    WHERE restaurant_id = ? AND expense_date ${expenseClause}
    GROUP BY category ORDER BY total DESC
  `).all(rid);

  const chart = db.prepare(`
    SELECT date(created_at) as date, SUM(total) as revenue FROM orders
    WHERE restaurant_id = ? AND status != 'cancelled' AND created_at ${orderClause}
    GROUP BY date(created_at) ORDER BY date
  `).all(rid);

  res.json({
    revenue: revenue.total,
    expenses: expenses.total,
    profit: revenue.total - expenses.total,
    avgTicket: avgTicket.avg,
    byCategory,
    chart,
  });
});

router.get("/expenses", requirePermission("finance"), (req, res) => {
  const rid = restaurantScope(req);
  const expenses = db.prepare(`
    SELECT * FROM expenses WHERE restaurant_id = ? ORDER BY expense_date DESC LIMIT 100
  `).all(rid);
  res.json(expenses);
});

router.post("/expenses", requirePermission("finance"), (req, res) => {
  const rid = restaurantScope(req);
  const { description, category, amount, payment_method, notes, expense_date } = req.body;
  if (!description || !category || !amount || !expense_date) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }
  const result = db.prepare(`
    INSERT INTO expenses (restaurant_id, description, category, amount, payment_method, notes, expense_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(rid, description, category, amount, payment_method || null, notes || null, expense_date);
  res.status(201).json(db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid));
});

router.delete("/expenses/:id", requirePermission("finance"), (req, res) => {
  const rid = restaurantScope(req);
  db.prepare("DELETE FROM expenses WHERE id = ? AND restaurant_id = ?").run(req.params.id, rid);
  res.json({ ok: true });
});

router.get("/payments", requirePermission("finance"), (req, res) => {
  const rid = restaurantScope(req);
  const methods = db.prepare(`
    SELECT payment_method, COUNT(*) as count, SUM(total) as total
    FROM orders WHERE restaurant_id = ? AND status != 'cancelled' AND payment_method IS NOT NULL
    GROUP BY payment_method ORDER BY total DESC
  `).all(rid);
  const configured = db.prepare("SELECT * FROM payment_methods WHERE restaurant_id = ? ORDER BY sort_order").all(rid);
  res.json({ sales: methods, methods: configured });
});

router.put("/payments/:id", requirePermission("finance"), (req, res) => {
  const rid = restaurantScope(req);
  const { active, sort_order } = req.body;
  db.prepare(`
    UPDATE payment_methods SET active = COALESCE(?, active), sort_order = COALESCE(?, sort_order)
    WHERE id = ? AND restaurant_id = ?
  `).run(active !== undefined ? (active ? 1 : 0) : null, sort_order, req.params.id, rid);
  res.json(db.prepare("SELECT * FROM payment_methods WHERE id = ?").get(req.params.id));
});

export default router;
