import {
  auth, db, isFirebaseConfigured, requireFirebase, collection, doc,
  query, where, getDocs, getDoc, writeBatch, updateDoc, increment,
  serverTimestamp, normalizePhone, maskPhone, setDoc
} from "./firebase-config.js";
import { initI18n, t, CITIES, CATEGORY_IDS, getLanguage, formatNumber, formatDate } from "./i18n.js";
import { $, node, icon, initShell, message, errorKey, busy, openDialog } from "./shared.js";
import { initAuth, showAuth, currentUser } from "./auth-ui.js";

export const seedProfessionals = [
  { id: "ornek-kemal", fullName: "Kemal Usta", city: "Lefkoşa", categories: ["plumbing-electric"], bio: "Gönyeli ve çevresinde su tesisatı, kaçak kontrolü ve elektrik arızaları.", phone: "905338001101", isVerified: true, isFeatured: true },
  { id: "ornek-alsancak", fullName: "Girne Alsancak Klima Servisi", city: "Girne", categories: ["ac-repair"], bio: "Alsancak, Lapta ve Girne merkezde klima bakım, montaj ve arıza servisi.", phone: "905488001102", isVerified: true, isFeatured: true },
  { id: "ornek-hasan", fullName: "Hasan K.", city: "Gazimağusa", categories: ["moving"], bio: "Sakarya ve Gazimağusa genelinde evden eve nakliye, eşya paketleme ve küçük yük taşıma.", phone: "905338001103", isVerified: true, isFeatured: false },
  { id: "ornek-ayse", fullName: "Ayşe Hanım Temizlik", city: "İskele", categories: ["cleaning"], bio: "Long Beach ve İskele merkezde ev, ofis ve taşınma sonrası temizlik.", phone: "905488001104", isVerified: false, isFeatured: false },
  { id: "ornek-mehmet", fullName: "Mehmet Usta", city: "Güzelyurt", categories: ["locksmith-tow"], bio: "Güzelyurt ve çevresinde kapı açma, kilit değişimi ve araç kurtarma hizmeti.", phone: "905338001105", isVerified: true, isFeatured: false },
  { id: "ornek-lefke", fullName: "Lefke Teknik Servis", city: "Lefke", categories: ["ac-repair", "plumbing-electric"], bio: "Lefke ve Gemikonağı bölgesinde klima bakımı ve ev içi tesisat işleri.", phone: "905488001106", isVerified: false, isFeatured: false }
].map(pro => ({ ...pro, role: "pro", ratingAvg: 0, reviewCount: 0, whatsappClicks: 0, featuredUntil: null, demo: true }));

let professionals = [];
let demoMode = !isFirebaseConfigured;
let directoryFailed = false;
let step = 0;
let submitted = false;
let submitting = false;
let waitingForAuth = false;
let requestReference = null;
let selectedReviewPro = null;
let reviewsVersion = 0;
const requestForm = $("#request-form");
const requestDialog = $("#request-dialog");
const categoryIcons = { "ac-repair": "snow", "plumbing-electric": "bolt", cleaning: "clean", moving: "truck", "locksmith-tow": "key" };

function isFeatured(pro) {
  if (!pro.isFeatured) return false;
  if (pro.demo) return true;
  return Boolean(pro.featuredUntil?.toDate && pro.featuredUntil.toDate().getTime() > Date.now());
}

function renderShortcuts() {
  $("#service-shortcuts").replaceChildren(...CATEGORY_IDS.map(category => {
    const button = node("button", {
      class: "service-chip", type: "button",
      "aria-pressed": String($("#filter-category").value === category)
    }, [icon(categoryIcons[category]), node("span", { text: t(`categories.${category}`) })]);
    button.classList.toggle("is-active", $("#filter-category").value === category);
    button.addEventListener("click", () => {
      $("#filter-category").value = $("#filter-category").value === category ? "" : category;
      applyFilters();
    });
    return button;
  }));
}

function professionalCard(pro) {
  const featured = isFeatured(pro);
  const badges = node("div", { class: "badges" });
  if (featured) badges.append(node("span", { class: "badge badge-featured", text: t("pro.sponsored") }));
  if (pro.isVerified) badges.append(node("span", { class: "badge badge-verified" }, [icon("shield"), t("pro.verified")]));
  const initials = pro.fullName.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("tr");
  const reviewButton = node("button", { class: "text-button", type: "button", disabled: pro.demo }, [
    pro.reviewCount > 0 ? t("pro.reviews", { count: formatNumber(pro.reviewCount) }) : t("pro.noReviews")
  ]);
  reviewButton.addEventListener("click", () => openReviews(pro));
  const rating = node("div", { class: "rating" }, pro.reviewCount > 0 ? [
    icon("star"), node("strong", {
      text: formatNumber(pro.ratingAvg, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      "aria-label": t("pro.rating", { rating: pro.ratingAvg })
    }), reviewButton
  ] : [reviewButton]);
  const contact = node("button", { class: "btn btn-whatsapp full-width", type: "button", disabled: pro.demo || !normalizePhone(pro.phone) }, [
    icon("message"), node("span", { text: t("pro.whatsapp") })
  ]);
  contact.addEventListener("click", () => contactProfessional(pro, contact));
  return node("article", { class: `pro-card${featured ? " is-featured" : ""}` }, [
    badges,
    node("div", { class: "pro-card-header" }, [
      node("div", { class: "pro-avatar", "aria-hidden": "true", text: initials }),
      node("div", {}, [node("h3", { text: pro.fullName }), node("p", { class: "pro-location", text: t(`cities.${pro.city}`) })])
    ]),
    node("p", { class: "pro-category", text: pro.categories.map(category => t(`categories.${category}`)).join(" · ") }),
    node("p", { class: "pro-bio", text: pro.bio }),
    node("div", { class: "pro-card-footer" }, [rating, contact])
  ]);
}

function applyFilters() {
  const city = $("#filter-city").value;
  const category = $("#filter-category").value;
  const filtered = professionals.filter(pro => (!city || pro.city === city) && (!category || pro.categories.includes(category)));
  filtered.sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)) || b.ratingAvg - a.ratingAvg || a.fullName.localeCompare(b.fullName, getLanguage()));
  $("#pros-grid").replaceChildren(...filtered.map(professionalCard));
  $("#result-count").textContent = t("home.results", { count: formatNumber(filtered.length) });
  $("#directory-empty").hidden = filtered.length > 0 || directoryFailed;
  renderShortcuts();
  const url = new URL(window.location.href);
  for (const [key, value] of [["city", city], ["category", category]]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function loadProfessionals() {
  $("#directory-loading").hidden = false;
  $("#pros-grid").setAttribute("aria-busy", "true");
  directoryFailed = false;
  message($("#directory-message"));
  try {
    if (demoMode) {
      professionals = seedProfessionals;
      message($("#directory-message"), "home.demo", "notice");
    } else {
      requireFirebase();
      const snapshot = await getDocs(query(collection(db, "users"), where("role", "==", "pro")));
      professionals = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }));
    }
  } catch (error) {
    professionals = [];
    directoryFailed = true;
    message($("#directory-message"), "home.loadError");
    const retry = node("button", { class: "text-button", type: "button", text: t("common.retry") });
    retry.addEventListener("click", loadProfessionals);
    $("#directory-message").append(retry);
  } finally {
    $("#directory-loading").hidden = true;
    $("#pros-grid").setAttribute("aria-busy", "false");
    applyFilters();
  }
}

async function contactProfessional(pro, button) {
  const phone = normalizePhone(pro.phone);
  if (!phone || pro.demo) return;
  const category = $("#filter-category").value || pro.categories[0];
  const text = t("pro.whatsappMessage", {
    proName: pro.fullName, hostname: window.location.hostname, category: t(`categories.${category}`)
  });
  const url = new URL(`https://wa.me/${phone}`);
  url.searchParams.set("text", text);
  const opened = window.open(url.href, "_blank", "noopener,noreferrer");
  if (opened) opened.opener = null;
  busy(button, true);
  try {
    await updateDoc(doc(db, "users", pro.id), { whatsappClicks: increment(1) });
  } catch {
    message($("#directory-message"), "home.clickNotCounted", "notice");
  } finally {
    busy(button, false);
  }
}

function renderWizard() {
  document.querySelectorAll("[data-step]").forEach(element => { element.hidden = submitted || Number(element.dataset.step) !== step; });
  document.querySelectorAll("[data-progress]").forEach(element => {
    const index = Number(element.dataset.progress);
    element.classList.toggle("is-active", index === step);
    element.classList.toggle("is-complete", index < step);
    if (index === step) element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  });
  $("#wizard-step-label").textContent = t("wizard.step", { current: step + 1, total: 4 });
  $("#wizard-back").disabled = submitting;
  $("#wizard-back").textContent = t(step === 0 ? "common.cancel" : "common.back");
  $("#wizard-next").textContent = t(step === 3 ? "wizard.submit" : "common.next");
  $("#wizard-footer").hidden = submitted;
  $("#wizard-progress").hidden = submitted;
  $("#request-success").hidden = !submitted;
}

function validateStep(index) {
  const values = new FormData(requestForm);
  const invalid = (key, selector) => {
    message($("#request-message"), key);
    const input = $(selector);
    input?.setAttribute("aria-invalid", "true");
    input?.focus();
    return false;
  };
  requestForm.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute("aria-invalid"));
  if (index === 0) {
    if (!CATEGORY_IDS.includes(values.get("category"))) return invalid("errors.category", "#request-category");
    const details = String(values.get("description") || "").trim();
    if (details.length < 20 || details.length > 2000) return invalid("errors.details", "#request-details");
  }
  if (index === 1 && !["acil", "bu_hafta", "esnek"].includes(values.get("urgency"))) return invalid("errors.required", '[name="urgency"]');
  if (index === 2) {
    if (!CITIES.includes(values.get("city"))) return invalid("errors.city", "#request-city");
    if (String(values.get("district") || "").trim().length < 2) return invalid("errors.required", "#request-district");
  }
  if (index === 3) {
    if (String(values.get("customerName") || "").trim().length < 2) return invalid("errors.required", "#request-name");
    if (!normalizePhone(values.get("customerPhone"))) return invalid("errors.phone", "#request-phone");
    if (!$("#request-consent").checked) return invalid("errors.consent", "#request-consent");
  }
  message($("#request-message"));
  return true;
}

function openRequest() {
  if (submitting) return;
  if (submitted) {
    requestForm.reset();
    submitted = false;
    step = 0;
    requestReference = null;
  }
  if ($("#filter-category").value) $("#request-category").value = $("#filter-category").value;
  if ($("#filter-city").value) $("#request-city").value = $("#filter-city").value;
  renderWizard();
  openDialog(requestDialog);
}

async function submitRequest() {
  if (submitting || submitted) return;
  try {
    requireFirebase();
    for (let index = 0; index < 4; index++) {
      if (!validateStep(index)) { step = index; renderWizard(); return; }
    }
    if (!auth.currentUser) {
      waitingForAuth = true;
      showAuth("login");
      return;
    }
    waitingForAuth = false;
    submitting = true;
    busy($("#wizard-next"), true);
    $("#wizard-back").disabled = true;
    const values = new FormData(requestForm);
    const phone = normalizePhone(values.get("customerPhone"));
    requestReference ??= doc(collection(db, "job_requests"));
    const batch = writeBatch(db);
    batch.set(requestReference, {
      customerName: String(values.get("customerName")).trim(),
      customerPhone: maskPhone(phone),
      category: values.get("category"), city: values.get("city"),
      district: String(values.get("district")).trim(),
      details: { description: String(values.get("description")).trim() },
      urgency: values.get("urgency"), status: "open", unlockedBy: [],
      createdAt: serverTimestamp()
    });
    batch.set(doc(db, "job_requests", requestReference.id, "private", "contact"), {
      customerPhone: phone, customerUid: auth.currentUser.uid
    });
    await batch.commit();
    submitted = true;
    $("#request-reference").textContent = t("dashboard.ref", { id: requestReference.id });
    requestForm.reset();
  } catch (error) {
    message($("#request-message"), errorKey(error));
  } finally {
    submitting = false;
    busy($("#wizard-next"), false);
    renderWizard();
  }
}

function createReviewsDialog() {
  const dialog = node("dialog", { class: "modal", id: "reviews-dialog", "aria-labelledby": "reviews-title" }, [
    node("div", { class: "modal-header" }, [node("h2", { id: "reviews-title", text: t("reviews.title") }), node("button", { class: "btn btn-secondary btn-icon", type: "button", "aria-label": t("common.close"), id: "reviews-close" }, [icon("close")])]),
    node("div", { class: "modal-body stack" }, [
      node("div", { id: "reviews-list", class: "stack" }),
      node("form", { id: "review-form", class: "stack" }, [
        node("h3", { text: t("reviews.write"), "data-i18n": "reviews.write" }),
        node("div", { class: "field" }, [node("label", { for: "review-rating", text: t("reviews.rating"), "data-i18n": "reviews.rating" }), node("select", { id: "review-rating", name: "rating" }, [1, 2, 3, 4, 5].reverse().map(value => node("option", { value, text: `${value} / 5` })))]),
        node("div", { class: "field" }, [node("label", { for: "review-comment", text: t("reviews.comment"), "data-i18n": "reviews.comment" }), node("textarea", { id: "review-comment", name: "comment", minlength: 20, maxlength: 1000, required: true })]),
        node("div", { id: "review-message", hidden: true }),
        node("button", { class: "btn btn-primary", type: "submit", id: "review-submit", text: t("reviews.submit"), "data-i18n": "reviews.submit" })
      ])
    ])
  ]);
  document.body.append(dialog);
  $("#reviews-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => document.body.classList.toggle("modal-open", Boolean($("dialog[open]"))));
  $("#review-form").addEventListener("submit", submitReview);
}

async function openReviews(pro) {
  selectedReviewPro = pro;
  const version = ++reviewsVersion;
  $("#reviews-title").textContent = `${pro.fullName} · ${t("reviews.title")}`;
  $("#reviews-list").textContent = t("common.loading");
  message($("#review-message"));
  openDialog($("#reviews-dialog"));
  try {
    const snapshot = await getDocs(query(collection(db, "reviews"), where("proId", "==", pro.id), where("isApproved", "==", true)));
    if (version !== reviewsVersion) return;
    const reviews = snapshot.docs.map(entry => entry.data()).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    $("#reviews-list").replaceChildren(...reviews.map(review => node("article", { class: "review-card stack" }, [
      node("div", { class: "row spread" }, [node("strong", { text: review.customerName }), node("span", { class: "rating", text: `${review.rating} / 5` })]),
      node("p", { text: review.comment }), node("p", { class: "help-text", text: formatDate(review.createdAt) })
    ])));
    if (!reviews.length) $("#reviews-list").textContent = t("reviews.empty");
  } catch (error) {
    $("#reviews-list").textContent = t(errorKey(error));
  }
}

async function submitReview(event) {
  event.preventDefault();
  if (!currentUser) { showAuth(); return; }
  const button = $("#review-submit");
  const comment = $("#review-comment").value.trim();
  const rating = Number($("#review-rating").value);
  if (comment.length < 20 || comment.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    message($("#review-message"), "reviews.invalid"); return;
  }
  busy(button, true);
  try {
    const profile = await getDoc(doc(db, "users", currentUser.uid));
    if (!profile.exists()) throw { code: "not-found" };
    const proId = selectedReviewPro.id;
    await setDoc(doc(db, "reviews", `${currentUser.uid}_${proId}`), {
      proId, customerName: profile.data().fullName, rating, comment,
      isApproved: false, createdAt: serverTimestamp()
    });
    $("#review-comment").value = "";
    message($("#review-message"), "reviews.pending", "success");
  } catch (error) {
    message($("#review-message"), errorKey(error));
  } finally { busy(button, false); }
}

initI18n();
initShell();
createReviewsDialog();
initAuth();
const parameters = new URL(window.location.href).searchParams;
if (CITIES.includes(parameters.get("city"))) $("#filter-city").value = parameters.get("city");
if (CATEGORY_IDS.includes(parameters.get("category"))) $("#filter-category").value = parameters.get("category");
$("#search-form").addEventListener("submit", event => { event.preventDefault(); applyFilters(); $("#ustalar").scrollIntoView(); });
$("#filter-city").addEventListener("change", applyFilters);
$("#filter-category").addEventListener("change", applyFilters);
$("#clear-filters").addEventListener("click", () => { $("#search-form").reset(); applyFilters(); });
document.querySelectorAll("[data-open-request]").forEach(button => button.addEventListener("click", openRequest));
requestForm.addEventListener("submit", event => {
  event.preventDefault();
  if (submitting) return;
  if (!validateStep(step)) return;
  if (step < 3) { step++; renderWizard(); $(`[data-step="${step}"] input, [data-step="${step}"] select`)?.focus(); }
  else submitRequest();
});
$("#wizard-back").addEventListener("click", () => {
  if (step === 0) requestDialog.close();
  else { step--; message($("#request-message")); renderWizard(); }
});
requestDialog.addEventListener("close", () => { waitingForAuth = false; });
requestDialog.addEventListener("cancel", event => { if (submitting) event.preventDefault(); });
document.addEventListener("hallet:authenticated", () => { if (waitingForAuth && requestDialog.open) submitRequest(); });
document.addEventListener("hallet:languagechange", () => {
  applyFilters(); renderWizard();
  if (submitted && requestReference) $("#request-reference").textContent = t("dashboard.ref", { id: requestReference.id });
  if ($("#reviews-dialog").open && selectedReviewPro) openReviews(selectedReviewPro);
});
$("#privacy-button").addEventListener("click", () => openDialog($("#privacy-dialog")));
renderWizard();
loadProfessionals();
