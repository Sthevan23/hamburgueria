import { Router } from "express";
import db from "../db/database.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

function periodFilter(period, customFrom, customTo) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (period === "today") return { clause: "date(o.created_at) = date('now')", params: [] };
  if (period === "7d") return { clause: "o.created_at >= datetime('now', '-7 days')", params: [] };
  if (period === "30d") return { clause: "o.created_at >= datetime('now', '-30 days')", params: [] };
  if (period === "custom" && customFrom && customTo) {
    return { clause: "date(o.created_at) BETWEEN ? AND ?", params: [customFrom, customTo] };
  }
  return { clause: "date(o.created_at) = date('now')", params: [] };
}

router.get("/", requirePermission("dashboard"), (req, res) => {
  const rid = restaurantScope(req);
  const period = req.query.period || "today";
  const { clause, params } = periodFilter(period, req.query.from, req.query.to);

  const stats = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue,
      COUNT(*) as orders,
      COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END), 0) as avgTicket,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as delivering
    FROM orders o WHERE restaurant_id = ? AND ${clause}
  `).get(rid, ...params);

  const customers = db.prepare("SELECT COUNT(*) as count FROM customers WHERE restaurant_id = ?").get(rid);
  const productsSold = db.prepare(`
    SELECT COALESCE(SUM(oi.quantity), 0) as count
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.restaurant_id = ? AND o.status != 'cancelled' AND ${clause}
  `).get(rid, ...params);

  const recentOrders = db.prepare(`
    SELECT id, order_number, customer_name, total, payment_method, status, created_at
    FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 8
  `).all(rid);

  const chartData = db.prepare(`
    SELECT date(created_at) as date,
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as revenue,
      COUNT(*) as orders
    FROM orders WHERE restaurant_id = ? AND created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at) ORDER BY date
  `).all(rid);

  const restaurant = db.prepare("SELECT is_open FROM restaurants WHERE id = ?").get(rid);

  res.json({
    stats: {
      revenue: stats.revenue,
      orders: stats.orders,
      avgTicket: stats.avgTicket,
      customers: customers.count,
      productsSold: productsSold.count,
      pending: stats.pending,
      delivering: stats.delivering,
    },
    recentOrders,
    chartData,
    isOpen: !!restaurant.is_open,
  });
});

export default router;
