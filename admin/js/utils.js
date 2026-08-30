export const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dateTime = (v) => v ? new Date(v.replace(" ", "T")).toLocaleString("pt-BR") : "—";
export const statusLabel = { new: "Novo", preparing: "Em preparo", ready: "Pronto", delivering: "Saiu p/ entrega", completed: "Concluído", cancelled: "Cancelado" };
export const statusBadge = (s) => `<span class="badge badge--${s}">${statusLabel[s] || s}</span>`;

export function toast(msg, type = "success") {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function confirmAction(msg) {
  return window.confirm(msg);
}

export function openModal(title, bodyHtml, footerHtml = "") {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal" role="dialog">
        <div class="modal__head"><h2>${title}</h2><button class="icon-btn" type="button" data-close-modal><i data-lucide="x"></i></button></div>
        <div class="modal__body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal__footer" style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">${footerHtml}</div>` : ""}
      </div>
    </div>`;
  root.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
  root.querySelector("#modalOverlay")?.addEventListener("click", (e) => { if (e.target.id === "modalOverlay") closeModal(); });
  window.lucide?.createIcons();
  return root;
}

export function closeModal() {
  document.getElementById("modalRoot").innerHTML = "";
}

export function skeletonCards(n = 4) {
  return `<div class="grid grid-4">${Array.from({ length: n }).map(() => `<div class="card"><div class="skeleton" style="height:14px;width:40%"></div><div class="skeleton" style="height:28px;width:60%;margin-top:12px"></div></div>`).join("")}</div>`;
}

export function emptyState(title, desc) {
  return `<div class="empty-state"><strong>${title}</strong><p>${desc}</p></div>`;
}

export function mobileTable(cardsHtml) {
  return `<div class="mobile-cards">${cardsHtml}</div>`;
}
