import { t, CITIES, CATEGORY_IDS } from "./i18n.js";

export const $ = (selector, root = document) => root.querySelector(selector);

export function node(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "text") element.textContent = String(value);
    else if (key === "class") element.className = value;
    else element.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [children].flat(Infinity)) {
    if (child !== null && child !== undefined) element.append(child);
  }
  return element;
}

const paths = {
  search: ["M21 21l-5-5", "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0"],
  check: ["M5 12l4 4L19 6"],
  shield: ["M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z", "m8 12 3 3 5-6"],
  star: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"],
  pin: ["M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z", "M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0"],
  message: ["M21 11.5a9 9 0 0 1-13 8L3 21l1.5-5a9 9 0 1 1 16.5-4.5Z", "M8 8c0 4 4 8 8 8l1-3-3-1-1 1-2-2 1-1-1-3-3 1Z"],
  close: ["m6 6 12 12M6 18 18 6"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
  arrow: ["M5 12h14m-6-6 6 6-6 6"],
  clock: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", "M12 7v5l3 2"],
  wallet: ["M20 8V5H5a2 2 0 0 0 0 4h16v11H5a2 2 0 0 1-2-2V7", "M21 12h-5v5h5"],
  tool: ["M14 6a5 5 0 0 0-6 6L3 17a3 3 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-4 4-4-4 4-4Z"],
  snow: ["M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3"],
  bolt: ["m13 2-9 12h7l-1 8 10-13h-7l0-7Z"],
  clean: ["m14 3 7 7-9 11-9-9L14 3Z", "m7 8 9 9M3 21l5-5"],
  truck: ["M3 5h11v12H3V5Zm11 5h4l3 4v3h-7", "M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0m12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0"],
  key: ["M14 10a5 5 0 1 1 0-1M14 10l7 7-3 3-2-2-2 2-3-3", "M8 7h.01"],
  user: ["M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0", "M4 21v-2a8 8 0 0 1 16 0v2"],
  list: ["M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"],
  info: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", "M12 11v6M12 7h.01"]
};

export function icon(name, extraClass = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round",
    "aria-hidden": "true", focusable: "false", class: `icon ${extraClass}`
  })) svg.setAttribute(key, value);
  for (const d of paths[name] ?? paths.tool) {
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(element => {
    element.replaceChildren(icon(element.dataset.icon));
  });
}

export function fillSelect(select, values, namespace, emptyKey) {
  const selected = select.value;
  select.replaceChildren(node("option", { value: "", text: t(emptyKey) }));
  values.forEach(value => select.append(node("option", {
    value, text: t(`${namespace}.${value}`)
  })));
  select.value = selected;
}

export function fillLocationFields(root = document) {
  root.querySelectorAll("[data-cities]").forEach(select => {
    fillSelect(select, CITIES, "cities", select.dataset.emptyKey || "common.city");
  });
  root.querySelectorAll("[data-categories]").forEach(select => {
    fillSelect(select, CATEGORY_IDS, "categories", select.dataset.emptyKey || "common.category");
  });
}

export function message(target, key = "", type = "error", variables = {}) {
  target.hidden = !key;
  target.className = `message message-${type}`;
  target.textContent = key ? t(key, variables) : "";
  if (key) target.dataset.messageKey = key;
  else delete target.dataset.messageKey;
  target.setAttribute("role", type === "error" ? "alert" : "status");
}

export function errorKey(error) {
  const code = String(error?.code ?? "").replace("firestore/", "");
  const keys = {
    "hallet/firebase-not-configured": "config",
    "auth/email-already-in-use": "emailInUse",
    "auth/invalid-email": "email",
    "auth/weak-password": "password",
    "auth/invalid-credential": "invalidCredentials",
    "auth/wrong-password": "invalidCredentials",
    "auth/user-not-found": "invalidCredentials",
    "auth/popup-closed-by-user": "popupClosed",
    "auth/cancelled-popup-request": "popupClosed",
    "auth/popup-blocked": "popupBlocked",
    "auth/unauthorized-domain": "unauthorizedDomain",
    "auth/too-many-requests": "tooManyRequests",
    "auth/network-request-failed": "network",
    "permission-denied": "permission",
    "unavailable": "unavailable",
    "not-found": "notFound",
    "hallet/no-credits": "noCredits",
    "hallet/closed": "closed"
  };
  const key = keys[code] || "unknown";
  return ["noCredits", "closed"].includes(key) ? `dashboard.${key}` : `errors.${key}`;
}

export function busy(button, active) {
  button.disabled = active;
  button.setAttribute("aria-busy", String(active));
}

export function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
}

export function initShell() {
  hydrateIcons();
  fillLocationFields();
  $("[data-menu-toggle]")?.addEventListener("click", event => {
    const button = event.currentTarget;
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    $("#site-nav")?.classList.toggle("is-open", open);
  });
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("close", () => {
      document.body.classList.toggle("modal-open", Boolean($("dialog[open]")));
    });
    dialog.querySelectorAll("[data-close-dialog]").forEach(button => {
      button.addEventListener("click", () => dialog.close());
    });
  });
  document.addEventListener("hallet:languagechange", () => {
    fillLocationFields();
    document.querySelectorAll("[data-message-key]").forEach(element => {
      element.textContent = t(element.dataset.messageKey);
    });
  });
}
