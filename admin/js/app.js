import {
  AuthAPI, setAuth, clearAuth, getUser, SettingsAPI, NotificationsAPI, MenuAPI, OrdersAPI,
} from "./api.js";
import { getPrintSettings, openPrint, wasPrinted, markPrinted } from "./print.js";
import { toast, openModal, closeModal } from "./utils.js";
import {
  renderDashboard, renderOrders, renderMenu, renderAddons, renderStock, renderFinance,
  renderCustomers, renderCoupons, renderReports, renderSettings, renderUsers,
  renderNotifications, renderPayments,
} from "./pages.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", roles: ["admin", "manager"] },
  { id: "orders", label: "Pedidos", icon: "clipboard-list", roles: ["admin", "manager", "attendant"] },
  { id: "menu", label: "Cardápio", icon: "utensils", roles: ["admin", "manager"] },
  { id: "addons", label: "Adicionais", icon: "plus-circle", roles: ["admin", "manager"] },
  { id: "stock", label: "Estoque", icon: "package", roles: ["admin", "manager"] },
  { id: "finance", label: "Financeiro", icon: "wallet", roles: ["admin", "manager"] },
  { id: "payments", label: "Pagamentos", icon: "credit-card", roles: ["admin", "manager"] },
  { id: "customers", label: "Clientes", icon: "users", roles: ["admin", "manager", "attendant"] },
  { id: "coupons", label: "Cupons", icon: "ticket", roles: ["admin", "manager"] },
  { id: "reports", label: "Relatórios", icon: "bar-chart-3", roles: ["admin", "manager"] },
  { id: "settings", label: "Configurações", icon: "settings", roles: ["admin"] },
  { id: "users", label: "Usuários", icon: "shield", roles: ["admin"] },
  { id: "notifications", label: "Notificações", icon: "bell", roles: ["admin", "manager", "attendant", "kitchen"] },
];

const TITLES = {
  dashboard: ["Dashboard", "Visão geral do restaurante"],
  orders: ["Central de Pedidos", "Gerencie pedidos em tempo real"],
  menu: ["Cardápio", "Produtos e categorias"],
  addons: ["Adicionais", "Complementos e opções"],
  stock: ["Estoque", "Controle de inventário"],
  finance: ["Financeiro", "Receitas, despesas e lucro"],
  payments: ["Pagamentos", "Formas de pagamento"],
  customers: ["Clientes", "Base de clientes"],
  coupons: ["Cupons", "Promoções e descontos"],
  reports: ["Relatórios", "Análises e exportação"],
  settings: ["Configurações", "Dados do restaurante"],
  users: ["Usuários", "Equipe e permissões"],
  notifications: ["Notificações", "Alertas do sistema"],
};

let currentPage = "dashboard";
let pollSince = new Date().toISOString();
let isOpen = true;

const helpers = {
  openCategoryModal: (categories, rerender, cat = null) => {
    openModal(cat ? "Editar categoria" : "Nova categoria", `
      <form id="catForm" class="form-grid">
        <div class="field"><label>Nome</label><input name="label" required value="${cat?.label || ""}" /></div>
        <div class="field"><label>Slug</label><input name="slug" required value="${cat?.slug || ""}" /></div>
        <div class="field"><label>Ordem</label><input name="sort_order" type="number" value="${cat?.sort_order || 0}" /></div>
      </form>`, `<button class="btn btn--ghost" data-close-modal>Cancelar</button><button class="btn btn--primary" id="saveCatBtn">Salvar</button>`);
    document.getElementById("saveCatBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("catForm"));
      const body = Object.fromEntries(fd.entries());
      body.sort_order = Number(body.sort_order);
      if (cat) await MenuAPI.updateCategory(cat.id, body); else await MenuAPI.createCategory(body);
      closeModal(); toast("Categoria salva!"); rerender();
    };
  },
  openProductModal: (categories, products, rerender, product = null) => {
    openModal(product ? "Editar produto" : "Novo produto", `
      <form id="prodForm" class="form-grid">
        <div class="field"><label>Nome</label><input name="name" required value="${product?.name || ""}" /></div>
        <div class="field"><label>Slug</label><input name="slug" required value="${product?.slug || ""}" /></div>
        <div class="field"><label>Categoria</label><select name="category_id">${categories.map((c) => `<option value="${c.id}" ${product?.category_id == c.id ? "selected" : ""}>${c.label}</option>`).join("")}</select></div>
        <div class="form-row"><div class="field"><label>Preço</label><input name="price" type="number" step="0.01" required value="${product?.price || ""}" /></div>
        <div class="field"><label>Preço promocional</label><input name="promo_price" type="number" step="0.01" value="${product?.promo_price || ""}" /></div></div>
        <div class="field"><label>Descrição</label><textarea name="description" rows="3">${product?.description || ""}</textarea></div>
        <div class="field"><label>Imagem (URL)</label><input name="image_url" value="${product?.image_url || ""}" /></div>
        <div class="form-row"><div class="field"><label>SKU</label><input name="sku" value="${product?.sku || ""}" /></div>
        <div class="field"><label>Tempo preparo (min)</label><input name="prep_time" type="number" value="${product?.prep_time || 15}" /></div></div>
        <label><input type="checkbox" name="available" ${product?.available !== 0 ? "checked" : ""} /> Disponível</label>
        <label><input type="checkbox" name="is_highlight" ${product?.is_highlight ? "checked" : ""} /> Destaque</label>
      </form>`, `<button class="btn btn--ghost" data-close-modal>Cancelar</button><button class="btn btn--primary" id="saveProdBtn">Salvar</button>`);
    document.getElementById("saveProdBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("prodForm"));
      const body = Object.fromEntries(fd.entries());
      body.category_id = Number(body.category_id);
      body.price = Number(body.price);
      body.promo_price = body.promo_price ? Number(body.promo_price) : null;
      body.prep_time = Number(body.prep_time || 15);
      body.available = !!fd.get("available");
      body.is_highlight = !!fd.get("is_highlight");
      if (product) await MenuAPI.updateProduct(product.id, body); else await MenuAPI.createProduct(body);
      closeModal(); toast("Produto salvo!");
      const fresh = await MenuAPI.products();
      products.splice(0, products.length, ...fresh);
      rerender();
    };
  },
};

function showLogin() {
  document.getElementById("loginScreen").hidden = false;
  document.getElementById("appShell").hidden = true;
}

function showApp(user) {
  document.getElementById("loginScreen").hidden = true;
  document.getElementById("appShell").hidden = false;
  document.getElementById("userChip").textContent = user.name;
  if (user.role === "kitchen") {
    window.location.href = "/admin/kitchen.html";
    return;
  }
  buildNav(user.role);
  navigate("dashboard");
  startPolling();
}

function buildNav(role) {
  const items = NAV.filter((n) => n.roles.includes(role) || role === "admin");
  const html = items.map((n) => `<button class="nav-item" data-page="${n.id}"><i data-lucide="${n.icon}"></i><span>${n.label}</span></button>`).join("");
  document.getElementById("sidebarNav").innerHTML = html;
  document.getElementById("bottomNav").innerHTML = items.slice(0, 5).map((n) => `<button class="nav-item" data-page="${n.id}"><i data-lucide="${n.icon}"></i><span>${n.label}</span></button>`).join("");
  document.querySelectorAll("[data-page]").forEach((btn) => btn.addEventListener("click", () => navigate(btn.dataset.page)));
}

async function navigate(page) {
  currentPage = page;
  const [title, subtitle] = TITLES[page] || ["Painel", ""];
  document.getElementById("pageTitle").textContent = title;
  document.getElementById("pageSubtitle").textContent = subtitle;
  document.querySelectorAll(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.page === page));
  document.getElementById("sidebar")?.classList.remove("open");

  const container = document.getElementById("mainContent");
  container.innerHTML = `<div class="grid grid-2">${Array(2).fill('<div class="card"><div class="skeleton" style="height:80px"></div></div>').join("")}</div>`;

  try {
    switch (page) {
      case "dashboard": await renderDashboard(container); break;
      case "orders": await renderOrders(container, () => navigate("orders")); break;
      case "menu": await renderMenu(container, helpers); break;
      case "addons": await renderAddons(container); break;
      case "stock": await renderStock(container); break;
      case "finance": await renderFinance(container); break;
      case "payments": await renderPayments(container); break;
      case "customers": await renderCustomers(container); break;
      case "coupons": await renderCoupons(container); break;
      case "reports": await renderReports(container); break;
      case "settings": await renderSettings(container); break;
      case "users": await renderUsers(container); break;
      case "notifications": await renderNotifications(container); break;
      default: container.innerHTML = "<p>Página não encontrada.</p>";
    }
  } catch (err) {
    container.innerHTML = `<div class="card"><strong>Erro ao carregar</strong><p>${err.message}</p></div>`;
  }
  window.lucide?.createIcons();
}

async function updateStoreToggle() {
  try {
    const data = await SettingsAPI.get();
    isOpen = !!data.is_open;
    const btn = document.getElementById("storeToggle");
    const label = document.getElementById("storeToggleLabel");
    btn.classList.toggle("is-closed", !isOpen);
    label.textContent = isOpen ? "Restaurante aberto" : "Restaurante fechado";
  } catch {}
}

async function updateNotifBadge() {
  try {
    const items = await NotificationsAPI.list();
    const unread = items.filter((n) => !n.read).length;
    const badge = document.getElementById("notifBadge");
    badge.hidden = unread === 0;
    badge.textContent = unread;
  } catch {}
}

function startPolling() {
  setInterval(async () => {
    try {
      const data = await OrdersAPI.poll(pollSince);
      pollSince = new Date().toISOString();
      if (data.newOrders?.length) {
        document.getElementById("orderSound")?.play().catch(() => {});
        toast(`Novo pedido: #${data.newOrders[0].order_number}`, "success");
        if (getPrintSettings().autoPrint) {
          data.newOrders.forEach((order) => {
            if (wasPrinted(order.id)) return;
            markPrinted(order.id);
            openPrint(order.id, { silent: true });
          });
        }
        if (currentPage === "orders") navigate("orders");
      }
      updateNotifBadge();
    } catch {}
  }, 12000);
}

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("loginError");
  err.hidden = true;
  try {
    const data = await AuthAPI.login(
      document.getElementById("loginEmail").value.trim(),
      document.getElementById("loginPassword").value
    );
    setAuth(data.token, data.user, data.restaurant);
    showApp(data.user);
    updateStoreToggle();
    updateNotifBadge();
  } catch (error) {
    err.textContent = error.message;
    err.hidden = false;
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => { clearAuth(); showLogin(); });
document.getElementById("menuToggle")?.addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("storeToggle")?.addEventListener("click", async () => {
  const data = await SettingsAPI.toggleOpen();
  isOpen = data.isOpen;
  updateStoreToggle();
  toast(isOpen ? "Restaurante aberto!" : "Restaurante fechado.");
});
document.getElementById("notifBtn")?.addEventListener("click", () => navigate("notifications"));

(async function init() {
  window.lucide?.createIcons();
  const user = getUser();
  if (user && localStorage.getItem("admin_token")) {
    try {
      await AuthAPI.me();
      showApp(user);
      updateStoreToggle();
      updateNotifBadge();
    } catch { showLogin(); }
  } else showLogin();
})();
