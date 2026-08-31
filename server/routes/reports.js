import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", requirePermission("reports"), async (req, res) => {
  const rid = restaurantScope(req);
  const { from, to } = req.query;
  const dateFilter = from && to ? "AND date(o.created_at) BETWEEN ? AND ?" : "AND o.created_at >= datetime('now', '-30 days')";
  const params = from && to ? [rid, from, to] : [rid];

  const salesByDay = await db.prepare(`
    SELECT date(o.created_at) as date, COUNT(*) as orders,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) as revenue
    FROM orders o WHERE o.restaurant_id = ? ${dateFilter}
    GROUP BY date(o.created_at) ORDER BY date
  `).all(...params);

  const topProducts = await db.prepare(`
    SELECT oi.product_name, SUM(oi.quantity) as qty, SUM(oi.total_price) as revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.restaurant_id = ? AND o.status != 'cancelled' ${dateFilter}
    GROUP BY oi.product_name ORDER BY qty DESC LIMIT 10
  `).all(...params);

  const topCategories = await db.prepare(`
    SELECT c.label, SUM(oi.quantity) as qty, SUM(oi.total_price) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE o.restaurant_id = ? AND o.status != 'cancelled' ${dateFilter}
    GROUP BY c.label ORDER BY revenue DESC
  `).all(...params);

  const byHour = await db.prepare(`
    SELECT strftime('%H', o.created_at) as hour, COUNT(*) as orders
    FROM orders o WHERE o.restaurant_id = ? ${dateFilter}
    GROUP BY hour ORDER BY hour
  `).all(...params);

  const payments = await db.prepare(`
    SELECT payment_method, COUNT(*) as count, SUM(total) as total
    FROM orders o WHERE o.restaurant_id = ? AND o.status != 'cancelled' ${dateFilter}
    GROUP BY payment_method
  `).all(...params);

  const cancellations = await db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as lost
    FROM orders o WHERE o.restaurant_id = ? AND o.status = 'cancelled' ${dateFilter}
  `).get(...params);

  const topCustomers = await db.prepare(`
    SELECT c.name, c.phone, c.total_orders, c.total_spent
    FROM customers c WHERE c.restaurant_id = ? ORDER BY c.total_spent DESC LIMIT 10
  `).all(rid);

  const expenses = await db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    WHERE restaurant_id = ? ${from && to ? "AND expense_date BETWEEN ? AND ?" : "AND expense_date >= date('now', '-30 days')"}
  `).get(...(from && to ? [rid, from, to] : [rid]));

  const totalRevenue = salesByDay.reduce((s, d) => s + d.revenue, 0);

  res.json({
    salesByDay,
    topProducts,
    topCategories,
    byHour,
    payments,
    cancellations,
    topCustomers,
    totalRevenue,
    totalExpenses: expenses.total,
    profit: totalRevenue - expenses.total,
  });
});

router.get("/export", requirePermission("reports"), async (req, res) => {
  const rid = restaurantScope(req);
  const orders = await db.prepare(`
    SELECT order_number, customer_name, customer_phone, total, payment_method, status, type, created_at
    FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 500
  `).all(rid);

  const header = "Pedido,Cliente,Telefone,Total,Pagamento,Status,Tipo,Data\n";
  const rows = orders.map((o) =>
    [o.order_number, o.customer_name, o.customer_phone, o.total, o.payment_method, o.status, o.type, o.created_at]
      .map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=relatorio-pedidos.csv");
  res.send("\uFEFF" + header + rows);
});

export default router;
