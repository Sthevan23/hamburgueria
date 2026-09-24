const PRINT_KEY = "falcone_print_settings";

const DEFAULTS = {
  autoPrint: true,
  paper: "80",
  copies: 1,
};

export function getPrintSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PRINT_KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePrintSettings(next) {
  localStorage.setItem(PRINT_KEY, JSON.stringify({ ...getPrintSettings(), ...next }));
}

export function openPrint(orderId, { silent = false } = {}) {
  if (!orderId) return;
  const settings = getPrintSettings();
  const params = new URLSearchParams({
    id: String(orderId),
    paper: settings.paper,
    copies: String(settings.copies),
  });
  if (silent) params.set("autoprint", "1");
  window.open(`/admin/print.html?${params}`, `print-${orderId}`, "width=420,height=720");
}

export function markPrinted(orderId) {
  const key = "falcone_printed_orders";
  const ids = new Set(JSON.parse(sessionStorage.getItem(key) || "[]"));
  ids.add(Number(orderId));
  sessionStorage.setItem(key, JSON.stringify([...ids]));
}

export function wasPrinted(orderId) {
  const ids = new Set(JSON.parse(sessionStorage.getItem("falcone_printed_orders") || "[]"));
  return ids.has(Number(orderId));
}
