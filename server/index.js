import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./db/database.js";
import { seedDatabase } from "./db/seed.js";

import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import dashboardRoutes from "./routes/dashboard.js";
import ordersRoutes from "./routes/orders.js";
import menuRoutes from "./routes/menu.js";
import addonsRoutes from "./routes/addons.js";
import stockRoutes from "./routes/stock.js";
import financeRoutes from "./routes/finance.js";
import customersRoutes from "./routes/customers.js";
import couponsRoutes from "./routes/coupons.js";
import reportsRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import usersRoutes from "./routes/users.js";
import notificationsRoutes from "./routes/notifications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

initDatabase();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 3001;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

app.set("trust proxy", 1);
app.use(cors({
  origin: [
    APP_URL,
    "https://sthevandev.com.br",
    "http://localhost:3001",
    "http://localhost:3000",
  ],
}));
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/addons", addonsRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(express.static(rootDir));
app.use("/admin", express.static(path.join(rootDir, "admin")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(rootDir, "admin", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🍔 Burger Falcone rodando em ${APP_URL}`);
  console.log(`📋 Cardápio:  ${APP_URL}/`);
  console.log(`⚙️  Admin:     ${APP_URL}/admin/`);
  console.log(`👨‍🍳 Cozinha:  ${APP_URL}/admin/kitchen.html`);
  console.log(`\nLogin admin: admin@burgerfalcone.com / admin123\n`);
});
