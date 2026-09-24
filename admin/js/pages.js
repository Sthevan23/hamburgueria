import {
  DashboardAPI, OrdersAPI, MenuAPI, AddonsAPI, StockAPI, FinanceAPI,
  CustomersAPI, CouponsAPI, ReportsAPI, SettingsAPI, UsersAPI, NotificationsAPI,
} from "./api.js";
import { money, dateTime, statusBadge, emptyState, mobileTable } from "./utils.js";
import { openPrint, getPrintSettings, savePrintSettings } from "./print.js";

let revenueChart = null;

export async function renderDashboard(container, period = "today") {
  container.innerHTML = `<div class="tabs" id="dashTabs">
    ${["today", "7d", "30d"].map((p) => `<button class="tab ${p === period ? "active" : ""}" data-period="${p}">${p === "today" ? "Hoje" : p === "7d" ? "7 dias" : "30 dias"}</button>`).join("")}
  </div><div id="dashContent"></div>`;

  container.querySelectorAll("[data-period]").forEach((btn) => {
    btn.addEventListener("click", () => renderDashboard(container, btn.dataset.period));
  });

  const target = container.querySelector("#dashContent");
  target.innerHTML = `<div class="grid grid-4">${Array(4).fill('<div class="card"><div class="skeleton"></div></div>').join("")}</div>`;

  const data = await DashboardAPI.get(period);
  const s = data.stats;

  target.innerHTML = `
    <div class="grid grid-4">
      ${statCard("Faturamento", money(s.revenue), "dollar-sign")}
      ${statCard("Pedidos", s.orders, "shopping-bag")}
      ${statCard("Ticket médio", money(s.avgTicket), "trending-up")}
      ${statCard("Clientes", s.customers, "users")}
    </div>
    <div class="grid grid-3" style="margin-top:16px">
      ${statCard("Produtos vendidos", s.productsSold, "utensils")}
      ${statCard("Pendentes", s.pending, "clock")}
      ${statCard("Em entrega", s.delivering, "truck")}
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><div class="card__header"><h3 class="card__title">Faturamento</h3></div><canvas id="revenueChart" height="120"></canvas></div>
      <div class="card"><div class="card__header"><h3 class="card__title">Pedidos recentes</h3></div>
        <div class="table-wrap"><table><thead><tr><th>#</th><th>Cliente</th><th>Horário</th><th>Total</th><th>Pagamento</th><th>Status</th></tr></thead>
        <tbody>${data.recentOrders.map((o) => `<tr><td>#${o.order_number}</td><td>${o.customer_name}</td><td>${dateTime(o.created_at)}</td><td>${money(o.total)}</td><td>${o.payment_method || "—"}</td><td>${statusBadge(o.status)}</td></tr>`).join("") || `<tr><td colspan="6">${emptyState("Sem pedidos", "Os pedidos aparecerão aqui.")}</td></tr>`}</tbody></table></div>
      </div>
    </div>`;

  const ctx = document.getElementById("revenueChart");
  if (ctx) {
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.chartData.map((d) => d.date.slice(5)),
        datasets: [{ label: "Faturamento", data: data.chartData.map((d) => d.revenue), borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,.1)", fill: true, tension: .35 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#a1a1aa" } }, y: { ticks: { color: "#a1a1aa" } } } },
    });
  }
  window.lucide?.createIcons();
}

function statCard(label, value, icon) {
  return `<div class="card stat-card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div><div class="stat-icon"><i data-lucide="${icon}"></i></div></div></div>`;
}

const KANBAN_COLS = [
  { id: "new", label: "🟡 Novos" },
  { id: "preparing", label: "🔵 Em preparo" },
  { id: "ready", label: "🟣 Pronto" },
  { id: "delivering", label: "🚚 Entrega" },
  { id: "completed", label: "🟢 Concluído" },
  { id: "cancelled", label: "🔴 Cancelado" },
];

export async function renderOrders(container, onUpdate) {
  const orders = await OrdersAPI.list();
  container.innerHTML = `<div class="kanban">${KANBAN_COLS.map((col) => `
    <div class="kanban-col"><div class="kanban-col__head">${col.label} (${orders.filter((o) => o.status === col.id).length})</div>
    <div class="kanban-col__body">${orders.filter((o) => o.status === col.id).map((o) => orderCard(o)).join("") || `<p class="empty-state" style="padding:16px">Vazio</p>`}</div></div>`).join("")}</div>`;

  container.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await OrdersAPI.updateStatus(btn.dataset.id, btn.dataset.status);
      onUpdate?.();
      await renderOrders(container, onUpdate);
    });
  });
  container.querySelectorAll("[data-print]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openPrint(btn.dataset.print, { silent: true });
    });
  });
  window.lucide?.createIcons();
}

function orderCard(o) {
  const items = o.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || "";
  const next = { new: "preparing", preparing: "ready", ready: o.type === "delivery" ? "delivering" : "completed", delivering: "completed" };
  const nextStatus = next[o.status];
  return `<article class="order-card">
    <h4>#${o.order_number} · ${o.customer_name}</h4>
    <p>${dateTime(o.created_at)} · ${money(o.total)}</p>
    <p>${items}</p>
    <p>${o.payment_method || ""} · ${o.type === "delivery" ? "Entrega" : "Retirada"}</p>
    ${o.address_text ? `<p>${o.address_text}</p>` : ""}
    ${o.notes ? `<p><em>${o.notes}</em></p>` : ""}
    <div class="order-card__actions">
      <button class="btn btn--sm btn--ghost" data-print="${o.id}" type="button">Imprimir</button>
      ${nextStatus ? `<button class="btn btn--sm btn--primary" data-id="${o.id}" data-status="${nextStatus}">Avançar</button>` : ""}
      ${o.status !== "cancelled" && o.status !== "completed" ? `<button class="btn btn--sm btn--danger" data-id="${o.id}" data-status="cancelled">Cancelar</button>` : ""}
    </div>
  </article>`;
}

export async function renderMenu(container, helpers) {
  const [categories, products] = await Promise.all([MenuAPI.categories(), MenuAPI.products()]);
  container.innerHTML = `
    <div class="tabs"><button class="tab active" data-tab="products">Produtos</button><button class="tab" data-tab="categories">Categorias</button></div>
    <div class="toolbar"><input class="search-input" id="productSearch" placeholder="Buscar produto..." />
      <button class="btn btn--primary" id="newProductBtn"><i data-lucide="plus"></i> Novo produto</button></div>
    <div id="menuTabContent"></div>`;

  const renderProducts = (filter = "") => {
    const list = products.filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));
    document.getElementById("menuTabContent").innerHTML = `<div class="product-grid">${list.map((p) => `
      <div class="product-admin">
        <img src="${p.image_url || "../assets/icons/favicon.svg"}" alt="" />
        <div class="product-admin__body">
          <h4>${p.name}</h4>
          <p>${p.category_label} · ${money(p.promo_price || p.price)}</p>
          <p>${p.available ? "Disponível" : "Indisponível"}${p.is_highlight ? " · Destaque" : ""}</p>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            <button class="btn btn--sm btn--ghost" data-edit-product="${p.id}">Editar</button>
            <button class="btn btn--sm btn--ghost" data-dup-product="${p.id}">Duplicar</button>
            <button class="btn btn--sm btn--danger" data-del-product="${p.id}">Excluir</button>
          </div>
        </div>
      </div>`).join("")}</div>`;
    bindProductActions(categories, products, helpers, renderProducts);
  };

  const renderCategories = () => {
    document.getElementById("menuTabContent").innerHTML = `
      <div class="toolbar"><button class="btn btn--primary" id="newCatBtn">Nova categoria</button></div>
      <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Slug</th><th>Ordem</th><th>Status</th><th></th></tr></thead>
      <tbody>${categories.map((c) => `<tr><td>${c.label}</td><td>${c.slug}</td><td>${c.sort_order}</td><td>${c.active ? "Ativa" : "Inativa"}</td>
      <td><button class="btn btn--sm btn--ghost" data-edit-cat="${c.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
    document.getElementById("newCatBtn")?.addEventListener("click", () => helpers.openCategoryModal(categories, renderCategories));
    container.querySelectorAll("[data-edit-cat]").forEach((btn) => btn.addEventListener("click", () => helpers.openCategoryModal(categories, renderCategories, categories.find((c) => c.id == btn.dataset.editCat))));
  };

  container.querySelectorAll("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
    container.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.tab === "categories") renderCategories(); else renderProducts();
  }));

  document.getElementById("productSearch")?.addEventListener("input", (e) => renderProducts(e.target.value));
  document.getElementById("newProductBtn")?.addEventListener("click", () => helpers.openProductModal(categories, products, renderProducts));
  renderProducts();
  window.lucide?.createIcons();
}

function bindProductActions(categories, products, helpers, rerender) {
  document.querySelectorAll("[data-edit-product]").forEach((btn) => btn.addEventListener("click", () => {
    helpers.openProductModal(categories, products, rerender, products.find((p) => p.id == btn.dataset.editProduct));
  }));
  document.querySelectorAll("[data-dup-product]").forEach((btn) => btn.addEventListener("click", async () => {
    await MenuAPI.duplicateProduct(btn.dataset.dupProduct);
    const fresh = await MenuAPI.products();
    products.splice(0, products.length, ...fresh);
    rerender();
  }));
  document.querySelectorAll("[data-del-product]").forEach((btn) => btn.addEventListener("click", async () => {
    if (!confirm("Excluir produto?")) return;
    await MenuAPI.deleteProduct(btn.dataset.delProduct);
    const fresh = await MenuAPI.products();
    products.splice(0, products.length, ...fresh);
    rerender();
  }));
}

export async function renderAddons(container) {
  const groups = await AddonsAPI.groups();
  container.innerHTML = groups.map((g) => `
    <div class="card" style="margin-bottom:12px">
      <div class="card__header"><h3 class="card__title">${g.name}</h3><span>${g.required ? "Obrigatório" : "Opcional"} · min ${g.min_qty} / max ${g.max_qty}</span></div>
      <div class="table-wrap"><table><thead><tr><th>Item</th><th>Preço</th><th>Status</th></tr></thead>
      <tbody>${g.addons.map((a) => `<tr><td>${a.name}</td><td>${money(a.price)}</td><td>${a.active ? "Ativo" : "Inativo"}</td></tr>`).join("")}</tbody></table></div>
    </div>`).join("") || emptyState("Sem adicionais", "Configure grupos de complementos.");
}

export async function renderStock(container) {
  const items = await StockAPI.list();
  container.innerHTML = `
    <div class="table-wrap"><table><thead><tr><th>Produto</th><th>Qtd</th><th>Mínimo</th><th>Unidade</th><th>Status</th><th></th></tr></thead>
    <tbody>${items.map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.min_quantity}</td><td>${i.unit}</td>
    <td><span class="badge badge--${i.status}">${i.status === "normal" ? "Normal" : i.status === "low" ? "Baixo" : "Crítico"}</span></td>
    <td><button class="btn btn--sm btn--ghost" data-move="${i.id}">Movimentar</button></td></tr>`).join("")}</tbody></table></div>
    ${mobileTable(items.map((i) => `<div class="mobile-card"><strong>${i.name}</strong><p>${i.quantity} ${i.unit}</p></div>`).join(""))}`;
  container.querySelectorAll("[data-move]").forEach((btn) => btn.addEventListener("click", async () => {
    const type = prompt("Tipo: in, out, adjust, loss");
    const quantity = Number(prompt("Quantidade:"));
    if (!type || !quantity) return;
    await StockAPI.movement(btn.dataset.move, { type, quantity, reason: prompt("Motivo:") || "" });
    await renderStock(container);
  }));
}

export async function renderFinance(container, period = "30d") {
  const data = await FinanceAPI.dashboard(period);
  const expenses = await FinanceAPI.expenses();
  container.innerHTML = `
    <div class="grid grid-4">
      ${statCard("Faturamento", money(data.revenue), "dollar-sign")}
      ${statCard("Despesas", money(data.expenses), "receipt")}
      ${statCard("Lucro estimado", money(data.profit), "trending-up")}
      ${statCard("Ticket médio", money(data.avgTicket), "wallet")}
    </div>
    <div class="card" style="margin-top:16px"><div class="card__header"><h3 class="card__title">Despesas recentes</h3>
      <button class="btn btn--primary btn--sm" id="newExpenseBtn">Nova despesa</button></div>
      <div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th></tr></thead>
      <tbody>${expenses.slice(0, 20).map((e) => `<tr><td>${e.description}</td><td>${e.category}</td><td>${money(e.amount)}</td><td>${e.expense_date}</td></tr>`).join("")}</tbody></table></div></div>`;
  document.getElementById("newExpenseBtn")?.addEventListener("click", async () => {
    const description = prompt("Descrição:");
    const category = prompt("Categoria (ingredientes, funcionarios, aluguel...):");
    const amount = Number(prompt("Valor:"));
    const expense_date = prompt("Data (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
    if (!description || !category || !amount) return;
    await FinanceAPI.createExpense({ description, category, amount, expense_date });
    await renderFinance(container, period);
  });
  window.lucide?.createIcons();
}

export async function renderCustomers(container) {
  const [customers, ranking] = await Promise.all([CustomersAPI.list(), CustomersAPI.ranking()]);
  container.innerHTML = `
    <div class="grid grid-2">
      <div class="card"><h3 class="card__title">Melhores clientes</h3>
        <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Pedidos</th><th>Total</th></tr></thead>
        <tbody>${ranking.map((c) => `<tr><td>${c.name}</td><td>${c.total_orders}</td><td>${money(c.total_spent)}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="card"><h3 class="card__title">Todos os clientes</h3>
        <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>Pedidos</th><th>Último pedido</th></tr></thead>
        <tbody>${customers.map((c) => `<tr><td>${c.name}</td><td>${c.phone || "—"}</td><td>${c.total_orders}</td><td>${dateTime(c.last_order_at)}</td></tr>`).join("")}</tbody></table></div></div>
    </div>`;
}

export async function renderCoupons(container) {
  const coupons = await CouponsAPI.list();
  container.innerHTML = `
    <div class="toolbar"><button class="btn btn--primary" id="newCouponBtn">Novo cupom</button></div>
    <div class="table-wrap"><table><thead><tr><th>Código</th><th>Tipo</th><th>Valor</th><th>Mínimo</th><th>Usos</th><th>Status</th></tr></thead>
    <tbody>${coupons.map((c) => `<tr><td><strong>${c.code}</strong></td><td>${c.discount_type}</td><td>${c.discount_type === "percent" ? `${c.discount_value}%` : money(c.discount_value)}</td><td>${money(c.min_order)}</td><td>${c.used_count}${c.usage_limit ? `/${c.usage_limit}` : ""}</td><td>${c.active ? "Ativo" : "Inativo"}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("newCouponBtn")?.addEventListener("click", async () => {
    const code = prompt("Código:");
    const discount_value = Number(prompt("Valor do desconto:"));
    const discount_type = prompt("Tipo (percent ou fixed):", "percent");
    if (!code || !discount_value) return;
    await CouponsAPI.create({ code, discount_type, discount_value });
    await renderCoupons(container);
  });
}

export async function renderReports(container) {
  const data = await ReportsAPI.get();
  container.innerHTML = `
    <div class="toolbar"><button class="btn btn--primary" id="exportCsvBtn">Exportar CSV</button></div>
    <div class="grid grid-3">
      ${statCard("Faturamento", money(data.totalRevenue), "dollar-sign")}
      ${statCard("Despesas", money(data.totalExpenses), "receipt")}
      ${statCard("Lucro", money(data.profit), "trending-up")}
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><h3 class="card__title">Produtos mais vendidos</h3>
        <div class="table-wrap"><table><thead><tr><th>Produto</th><th>Qtd</th><th>Receita</th></tr></thead>
        <tbody>${data.topProducts.map((p) => `<tr><td>${p.product_name}</td><td>${p.qty}</td><td>${money(p.revenue)}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="card"><h3 class="card__title">Pagamentos</h3>
        <div class="table-wrap"><table><thead><tr><th>Forma</th><th>Pedidos</th><th>Total</th></tr></thead>
        <tbody>${data.payments.map((p) => `<tr><td>${p.payment_method}</td><td>${p.count}</td><td>${money(p.total)}</td></tr>`).join("")}</tbody></table></div></div>
    </div>`;
  document.getElementById("exportCsvBtn")?.addEventListener("click", async () => {
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/reports/export", { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
  window.lucide?.createIcons();
}

export async function renderSettings(container) {
  const data = await SettingsAPI.get();
  container.innerHTML = `
    <form id="settingsForm" class="card form-grid">
      <div class="form-row"><div class="field"><label>Nome</label><input name="name" value="${data.name || ""}" /></div>
      <div class="field"><label>WhatsApp</label><input name="whatsapp" value="${data.whatsapp || ""}" /></div></div>
      <div class="form-row"><div class="field"><label>Telefone</label><input name="phone" value="${data.phone || ""}" /></div>
      <div class="field"><label>Endereço</label><input name="address" value="${data.address || ""}" /></div></div>
      <div class="form-row"><div class="field"><label>Pedido mínimo</label><input name="min_order" type="number" step="0.01" value="${data.min_order || 0}" /></div>
      <div class="field"><label>Taxa entrega</label><input name="delivery_fee" type="number" step="0.01" value="${data.delivery_fee || 0}" /></div></div>
      <div class="field"><label>Mensagem quando fechado</label><textarea name="closed_message" rows="2">${data.closed_message || ""}</textarea></div>
      <button class="btn btn--primary" type="submit">Salvar configurações</button>
    </form>
    <form id="printerForm" class="card form-grid" style="margin-top:16px">
      <h3 class="card__title">Impressora térmica (MINIMEN)</h3>
      <p style="margin:0;color:var(--text-muted);font-size:.9rem">Mesmo fluxo da Aurora: o cupom abre em 80mm e o Windows usa a impressora MINIMEN no diálogo de impressão. Na primeira vez, escolha <strong>MINIMEN</strong> e marque para lembrar.</p>
      <label><input type="checkbox" name="autoPrint" ${getPrintSettings().autoPrint ? "checked" : ""} /> Imprimir automaticamente pedidos novos</label>
      <div class="form-row">
        <div class="field"><label>Largura do papel</label>
          <select name="paper">
            <option value="80" ${getPrintSettings().paper === "80" ? "selected" : ""}>80mm (MINIMEN / padrão)</option>
            <option value="58" ${getPrintSettings().paper === "58" ? "selected" : ""}>58mm</option>
          </select>
        </div>
        <div class="field"><label>Vias</label>
          <select name="copies">
            <option value="1" ${Number(getPrintSettings().copies) === 1 ? "selected" : ""}>1 via</option>
            <option value="2" ${Number(getPrintSettings().copies) === 2 ? "selected" : ""}>2 vias (cliente + cozinha)</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--primary" type="submit">Salvar impressora</button>
        <button class="btn btn--ghost" type="button" id="testPrintBtn">Testar impressão</button>
      </div>
    </form>
    <div class="card" style="margin-top:16px"><h3 class="card__title">Bairros de entrega</h3>
      <div class="table-wrap"><table><thead><tr><th>Bairro</th><th>Taxa</th></tr></thead>
      <tbody>${(data.zones || []).map((z) => `<tr><td>${z.name}</td><td>${money(z.fee)}</td></tr>`).join("")}</tbody></table></div></div>`;

  document.getElementById("settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await SettingsAPI.update(Object.fromEntries(fd.entries()));
  });

  document.getElementById("printerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    savePrintSettings({
      autoPrint: fd.get("autoPrint") === "on",
      paper: fd.get("paper") || "80",
      copies: Number(fd.get("copies") || 1),
    });
    alert("Configuração da impressora salva.");
  });

  document.getElementById("testPrintBtn")?.addEventListener("click", async () => {
    const orders = await OrdersAPI.list();
    if (!orders[0]) {
      alert("Faça um pedido de teste no cardápio para imprimir o cupom.");
      return;
    }
    openPrint(orders[0].id, { silent: true });
  });
}

export async function renderUsers(container) {
  const users = await UsersAPI.list();
  container.innerHTML = `
    <div class="toolbar"><button class="btn btn--primary" id="newUserBtn">Novo usuário</button></div>
    <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead>
    <tbody>${users.map((u) => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${u.active ? "Ativo" : "Inativo"}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("newUserBtn")?.addEventListener("click", async () => {
    const name = prompt("Nome:");
    const email = prompt("E-mail:");
    const password = prompt("Senha:");
    const role = prompt("Perfil (admin, manager, attendant, kitchen):", "attendant");
    if (!name || !email || !password) return;
    await UsersAPI.create({ name, email, password, role });
    await renderUsers(container);
  });
}

export async function renderNotifications(container) {
  const items = await NotificationsAPI.list();
  container.innerHTML = `
    <div class="toolbar"><button class="btn btn--ghost" id="readAllBtn">Marcar todas como lidas</button></div>
    <div class="grid">${items.map((n) => `<div class="card" style="opacity:${n.read ? .65 : 1}"><strong>${n.title}</strong><p style="color:var(--text-muted)">${n.message || ""}</p><small>${dateTime(n.created_at)}</small></div>`).join("") || emptyState("Sem notificações", "Você está em dia.")}</div>`;
  document.getElementById("readAllBtn")?.addEventListener("click", async () => {
    await NotificationsAPI.readAll();
    await renderNotifications(container);
  });
}

export async function renderPayments(container) {
  const data = await FinanceAPI.payments();
  container.innerHTML = `
    <div class="grid grid-2">
      <div class="card"><h3 class="card__title">Formas configuradas</h3>
        <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Status</th></tr></thead>
        <tbody>${data.methods.map((m) => `<tr><td>${m.name}</td><td>${m.active ? "Ativa" : "Inativa"}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="card"><h3 class="card__title">Vendas por forma</h3>
        <div class="table-wrap"><table><thead><tr><th>Forma</th><th>Pedidos</th><th>Total</th></tr></thead>
        <tbody>${data.sales.map((s) => `<tr><td>${s.payment_method}</td><td>${s.count}</td><td>${money(s.total)}</td></tr>`).join("")}</tbody></table></div></div>
    </div>`;
}
