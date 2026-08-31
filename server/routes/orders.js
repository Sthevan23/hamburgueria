import { Router } from "express";
import db from "../db/client.js";
import { authRequired, requirePermission, restaurantScope } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

async function getOrderWithItems(orderId, rid) {
  const order = await db.prepare("SELECT * FROM orders WHERE id = ? AND restaurant_id = ?").get(orderId, rid);
  if (!order) return null;
  const items = await db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
  for (const item of items) {
    item.addons = await db.prepare("SELECT * FROM order_item_addons WHERE order_item_id = ?").all(item.id);
  }
  return { ...order, items };
}

router.get("/", requirePermission("orders"), async (req, res) => {
  const rid = restaurantScope(req);
  const { status } = req.query;

  let query = "SELECT * FROM orders WHERE restaurant_id = ?";
  const params = [rid];
  if (status) { query += " AND status = ?"; params.push(status); }
  query += " ORDER BY created_at DESC";

  const ordersRaw = await db.prepare(query).all(...params);
  const orders = [];
  for (const order of ordersRaw) {
    const items = await db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    for (const item of items) {
      item.addons = await db.prepare("SELECT * FROM order_item_addons WHERE order_item_id = ?").all(item.id);
    }
    orders.push({ ...order, items });
  }

  res.json(orders);
});

router.get("/kitchen", requirePermission("kitchen"), async (req, res) => {
  const rid = restaurantScope(req);
  const ordersRaw = await db
    .prepare("SELECT * FROM orders WHERE restaurant_id = ? AND status IN ('new', 'preparing') ORDER BY created_at ASC")
    .all(rid);
  const orders = [];
  for (const order of ordersRaw) {
    const items = await db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    for (const item of items) {
      item.addons = await db.prepare("SELECT * FROM order_item_addons WHERE order_item_id = ?").all(item.id);
    }
    orders.push({ ...order, items });
  }
  res.json(orders);
});

router.get("/:id", requirePermission("orders"), async (req, res) => {
  const order = await getOrderWithItems(Number(req.params.id), restaurantScope(req));
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  res.json(order);
});

router.patch("/:id/status", requirePermission("orders"), async (req, res) => {
  const rid = restaurantScope(req);
  const { status } = req.body;
  const valid = ["new", "preparing", "ready", "delivering", "completed", "cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Status inválido." });

  const order = await db.prepare("SELECT * FROM orders WHERE id = ? AND restaurant_id = ?").get(req.params.id, rid);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

  let sql = "UPDATE orders SET status = ?, updated_at = ?";
  const params = [status, now];
  if (status === "preparing" && !order.accepted_at) {
    sql += ", accepted_at = ?";
    params.push(now);
  }
  if (status === "completed") {
    sql += ", completed_at = ?";
    params.push(now);
  }
  sql += " WHERE id = ? AND restaurant_id = ?";
  params.push(req.params.id, rid);
  await db.prepare(sql).run(...params);

  if (status === "cancelled") {
    await db.prepare(`
      INSERT INTO notifications (restaurant_id, type, title, message, data_json)
      VALUES (?, 'order_cancelled', ?, ?, ?)
    `).run(rid, `Pedido #${order.order_number} cancelado`, order.customer_name, JSON.stringify({ orderId: order.id }));
  }

  res.json(await getOrderWithItems(order.id, rid));
});

router.get("/poll/new", requirePermission("orders"), async (req, res) => {
  const rid = restaurantScope(req);
  const since = req.query.since || new Date(Date.now() - 60000).toISOString();
  const newOrders = await db
    .prepare("SELECT id, order_number, customer_name, total, created_at FROM orders WHERE restaurant_id = ? AND status = 'new' AND created_at > ?")
    .all(rid, since);
  const unread = await db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE restaurant_id = ? AND read = 0")
    .get(rid);
  res.json({ newOrders, unreadCount: unread.count });
});

export default router;
