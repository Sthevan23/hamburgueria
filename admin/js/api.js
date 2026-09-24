const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("admin_token");
}

export function setAuth(token, user, restaurant) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));
  if (restaurant) localStorage.setItem("admin_restaurant", JSON.stringify(restaurant));
}

export function clearAuth() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  localStorage.removeItem("admin_restaurant");
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem("admin_user")); } catch { return null; }
}

export async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (options.method || "GET").toUpperCase();
  if (["PUT", "PATCH", "DELETE"].includes(method)) {
    headers["X-HTTP-Method-Override"] = method;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

  if (!res.ok) {
    if (res.status === 401 && !path.includes("/auth/login")) {
      clearAuth();
      window.location.reload();
    }
    const fallback = res.status === 404
      ? "API do servidor não respondeu. Recarregue a página em alguns segundos."
      : "Erro na requisição.";
    throw new Error(data.error || fallback);
  }
  return data;
}

export const AuthAPI = {
  login: (email, password) => api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/auth/me"),
};

export const DashboardAPI = {
  get: (period = "today") => api(`/dashboard?period=${period}`),
};

export const OrdersAPI = {
  list: () => api("/orders"),
  get: (id) => api(`/orders/${id}`),
  updateStatus: (id, status) => api(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  poll: (since) => api(`/orders/poll/new?since=${encodeURIComponent(since)}`),
  kitchen: () => api("/orders/kitchen"),
};

export const MenuAPI = {
  categories: () => api("/menu/categories"),
  createCategory: (body) => api("/menu/categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id, body) => api(`/menu/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCategory: (id) => api(`/menu/categories/${id}`, { method: "DELETE" }),
  products: () => api("/menu/products"),
  createProduct: (body) => api("/menu/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => api(`/menu/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  duplicateProduct: (id) => api(`/menu/products/${id}/duplicate`, { method: "POST" }),
  deleteProduct: (id) => api(`/menu/products/${id}`, { method: "DELETE" }),
};

export const AddonsAPI = {
  groups: () => api("/addons/groups"),
  createGroup: (body) => api("/addons/groups", { method: "POST", body: JSON.stringify(body) }),
  updateGroup: (id, body) => api(`/addons/groups/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteGroup: (id) => api(`/addons/groups/${id}`, { method: "DELETE" }),
  createItem: (groupId, body) => api(`/addons/groups/${groupId}/items`, { method: "POST", body: JSON.stringify(body) }),
  updateItem: (id, body) => api(`/addons/items/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteItem: (id) => api(`/addons/items/${id}`, { method: "DELETE" }),
};

export const StockAPI = {
  list: () => api("/stock"),
  create: (body) => api("/stock", { method: "POST", body: JSON.stringify(body) }),
  movement: (id, body) => api(`/stock/${id}/movement`, { method: "POST", body: JSON.stringify(body) }),
  movements: (id) => api(`/stock/${id}/movements`),
};

export const FinanceAPI = {
  dashboard: (period) => api(`/finance/dashboard?period=${period || "30d"}`),
  expenses: () => api("/finance/expenses"),
  createExpense: (body) => api("/finance/expenses", { method: "POST", body: JSON.stringify(body) }),
  deleteExpense: (id) => api(`/finance/expenses/${id}`, { method: "DELETE" }),
  payments: () => api("/finance/payments"),
  updatePayment: (id, body) => api(`/finance/payments/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

export const CustomersAPI = {
  list: () => api("/customers"),
  ranking: () => api("/customers/ranking"),
  get: (id) => api(`/customers/${id}`),
};

export const CouponsAPI = {
  list: () => api("/coupons"),
  create: (body) => api("/coupons", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => api(`/coupons/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => api(`/coupons/${id}`, { method: "DELETE" }),
};

export const ReportsAPI = {
  get: (from, to) => {
    const q = from && to ? `?from=${from}&to=${to}` : "";
    return api(`/reports${q}`);
  },
  exportCsv: () => window.open(`${API_BASE}/reports/export?token=${getToken()}`, "_blank"),
};

export const SettingsAPI = {
  get: () => api("/settings"),
  update: (body) => api("/settings", { method: "PUT", body: JSON.stringify(body) }),
  toggleOpen: () => api("/settings/toggle-open", { method: "POST" }),
  createZone: (body) => api("/settings/zones", { method: "POST", body: JSON.stringify(body) }),
  updateZone: (id, body) => api(`/settings/zones/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteZone: (id) => api(`/settings/zones/${id}`, { method: "DELETE" }),
};

export const UsersAPI = {
  list: () => api("/users"),
  create: (body) => api("/users", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => api(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

export const NotificationsAPI = {
  list: () => api("/notifications"),
  readAll: () => api("/notifications/read-all", { method: "PATCH" }),
  read: (id) => api(`/notifications/${id}/read`, { method: "PATCH" }),
};
