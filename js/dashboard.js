import {
  auth, db, requireFirebase, collection, doc, getDoc, getDocs, updateDoc,
  query, where, onSnapshot, runTransaction, serverTimestamp, Timestamp,
  normalizePhone, formatPhone
} from "./firebase-config.js";
import { initI18n, t, CATEGORY_IDS, CITIES, formatNumber, formatDate } from "./i18n.js";
import { $, node, icon, initShell, message, errorKey, busy, openDialog } from "./shared.js";
import { initAuth, currentUser } from "./auth-ui.js";
import { createLeadService } from "./lead-service.js";

let profile = null;
let profileUnsubscribe = null;
let queryUnsubscribers = [];
let sessionVersion = 0;
let querySignature = "";
let matching = [];
let unlocked = [];
let activeTab = "requests";
let selectedLead = null;
let unlocking = false;
const contacts = new Map();
let adminProfessionals = [];
let adminReviews = [];

function appError(code) { return Object.assign(new Error(code), { code }); }

export async function unlockLead(jobId) {
  requireFirebase();
  return createLeadService({ db, doc, getDoc, runTransaction, serverTimestamp })(auth.currentUser?.uid, jobId);
}

function stopQueries() {
  queryUnsubscribers.forEach(unsubscribe => unsubscribe());
  queryUnsubscribers = [];
  querySignature = "";
}

function selectTab(tab, focus = false) {
  if (tab === "admin" && profile?.role !== "admin") return;
  activeTab = tab;
  document.querySelectorAll("[data-tab]").forEach(button => {
    const selected = button.dataset.tab === tab;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    $(`#panel-${button.dataset.tab}`).hidden = !selected;
    if (selected && focus) button.focus();
  });
  if (tab === "admin") loadAdmin();
}

function renderProfileForm() {
  if (!profile) return;
  $("#profile-name").value = profile.fullName;
  $("#profile-phone").value = profile.phone ? formatPhone(profile.phone) : "";
  $("#profile-city").value = profile.city;
  $("#profile-bio").value = profile.bio;
  renderCategoryChecks(profile.categories);
  document.querySelectorAll("[data-pro-profile]").forEach(element => { element.hidden = profile.role !== "pro"; });
}

function renderCategoryChecks(selectedCategories) {
  $("#profile-categories").replaceChildren(...CATEGORY_IDS.map(category => node("label", { class: "check-label" }, [
    node("input", { type: "checkbox", name: "categories", value: category, checked: selectedCategories.includes(category) }),
    node("span", { text: t(`categories.${category}`) })
  ])));
}

function renderStats() {
  if (!profile) return;
  $("#dashboard-greeting").textContent = t("dashboard.welcome", { name: profile.fullName });
  $("#stat-credits").textContent = formatNumber(profile.credits);
  $("#stat-clicks").textContent = formatNumber(profile.whatsappClicks);
  $("#stat-requests").textContent = formatNumber(matching.length);
}

async function fetchContact(jobId) {
  const version = sessionVersion;
  const contact = await getDoc(doc(db, "job_requests", jobId, "private", "contact"));
  if (version !== sessionVersion || !contact.exists()) return;
  contacts.set(jobId, contact.data().customerPhone);
  renderLeads();
}

function leadCard(job) {
  const hasAccess = job.unlockedBy.includes(currentUser?.uid);
  const actualPhone = contacts.get(job.id);
  const badges = node("div", { class: "badges" }, [
    node("span", { class: `badge${job.urgency === "acil" ? " badge-urgent" : ""}`, text: t(`wizard.${job.urgency}`) })
  ]);
  if (job.status === "closed") badges.append(node("span", { class: "badge", text: t("dashboard.closed") }));
  const contact = node("div", { class: "lead-contact" }, [
    node("span", { class: "help-text", text: job.customerName }),
    actualPhone
      ? node("a", { class: "phone-number", href: `tel:+${actualPhone}`, text: formatPhone(actualPhone) })
      : node("span", { class: "phone-number", text: job.customerPhone })
  ]);
  let action;
  if (hasAccess) {
    action = node("button", { class: "btn btn-secondary", type: "button", text: t(actualPhone ? "dashboard.alreadyUnlocked" : "common.retry"), disabled: Boolean(actualPhone) });
    action.addEventListener("click", async () => {
      busy(action, true);
      try { await fetchContact(job.id); }
      catch (error) { message($("#dashboard-message"), errorKey(error)); }
      finally { busy(action, false); }
    });
  } else if (profile.role === "admin") {
    action = node("button", { class: "btn btn-secondary", type: "button", text: t("dashboard.contact") });
    action.addEventListener("click", async () => {
      busy(action, true);
      try { await fetchContact(job.id); }
      catch (error) { message($("#dashboard-message"), errorKey(error)); }
      finally { busy(action, false); }
    });
  } else {
    action = node("button", { class: "btn btn-primary", type: "button", text: t("dashboard.unlock"), disabled: job.status !== "open" });
    action.addEventListener("click", () => {
      selectedLead = job.id;
      message($("#unlock-message"));
      openDialog($("#unlock-dialog"));
    });
  }
  const footer = node("div", { class: "lead-footer" }, [contact, action]);
  if (profile.role === "admin" && job.status === "open") {
    const close = node("button", { class: "text-button", type: "button", text: t("dashboard.closeRequest") });
    close.addEventListener("click", async () => {
      busy(close, true);
      try {
        await updateDoc(doc(db, "job_requests", job.id), { status: "closed" });
        message($("#dashboard-message"), "dashboard.requestClosed", "success");
      } catch (error) { message($("#dashboard-message"), errorKey(error)); }
      finally { busy(close, false); }
    });
    footer.append(close);
  }
  return node("article", { class: "lead-card" }, [
    node("div", { class: "lead-header" }, [node("h3", { text: t(`categories.${job.category}`) }), badges]),
    node("div", { class: "lead-meta" }, [
      node("span", { text: `${t(`cities.${job.city}`)} / ${job.district}` }),
      node("span", { text: formatDate(job.createdAt) }),
      node("span", { text: t("dashboard.ref", { id: job.id }) })
    ]),
    node("p", { class: "lead-description", text: job.details.description }), footer
  ]);
}

function renderLeads() {
  if (!profile) return;
  for (const [selector, jobs] of [["#matching-requests", matching], ["#unlocked-requests", unlocked]]) {
    const sorted = [...jobs].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    $(selector).replaceChildren(...sorted.map(leadCard));
    if (!sorted.length) $(selector).append(node("div", { class: "empty-state", text: t("dashboard.emptyRequests") }));
  }
  renderStats();
}

function subscribeLeads() {
  const signature = JSON.stringify([profile.role, profile.city, profile.categories]);
  if (signature === querySignature) return;
  stopQueries();
  querySignature = signature;
  matching = []; unlocked = [];
  renderLeads();
  if (profile.role === "customer") return;
  const handleError = error => message($("#dashboard-message"), errorKey(error));
  let matchingQuery;
  if (profile.role === "admin") {
    matchingQuery = query(collection(db, "job_requests"), where("status", "==", "open"));
  } else if (profile.city && profile.categories.length) {
    matchingQuery = query(collection(db, "job_requests"), where("status", "==", "open"), where("city", "==", profile.city), where("category", "in", profile.categories));
  }
  const version = sessionVersion;
  if (matchingQuery) queryUnsubscribers.push(onSnapshot(matchingQuery, snapshot => {
    if (version !== sessionVersion) return;
    matching = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }));
    renderLeads();
  }, handleError));
  if (profile.role === "pro") queryUnsubscribers.push(onSnapshot(query(collection(db, "job_requests"), where("unlockedBy", "array-contains", currentUser.uid)), snapshot => {
    if (version !== sessionVersion) return;
    unlocked = snapshot.docs.map(entry => ({ id: entry.id, ...entry.data() }));
    renderLeads();
    unlocked.filter(job => !contacts.has(job.id)).forEach(job => {
      fetchContact(job.id).catch(handleError);
    });
  }, handleError));
}

function updateSession(user) {
  sessionVersion++;
  profileUnsubscribe?.();
  profileUnsubscribe = null;
  stopQueries();
  profile = null;
  matching = []; unlocked = []; contacts.clear();
  adminProfessionals = []; adminReviews = [];
  $("#admin-pros").replaceChildren();
  $("#admin-reviews").replaceChildren();
  $("#profile-form").reset();
  $("#dashboard-content").hidden = true;
  $("#dashboard-guest").hidden = Boolean(user);
  $("#dashboard-greeting").textContent = t("dashboard.heading");
  if ($("#unlock-dialog").open) $("#unlock-dialog").close();
  if (!user) { message($("#dashboard-message")); return; }
  message($("#dashboard-message"), "common.loading", "notice");
  const version = sessionVersion;
  profileUnsubscribe = onSnapshot(doc(db, "users", user.uid), snapshot => {
    if (version !== sessionVersion) return;
    if (!snapshot.exists()) { message($("#dashboard-message"), "auth.profileIncomplete", "notice"); return; }
    const first = !profile;
    profile = snapshot.data();
    $("#dashboard-content").hidden = false;
    $("#dashboard-guest").hidden = true;
    document.querySelectorAll("[data-admin-only]").forEach(element => { element.hidden = profile.role !== "admin"; });
    for (const tab of ["requests", "unlocked"]) $(`#tab-${tab}`).hidden = profile.role === "customer";
    if (first) {
      renderProfileForm();
      selectTab(profile.role === "customer" ? "profile" : "requests");
      message($("#dashboard-message"), profile.role === "customer" ? "dashboard.customerAccount" : "", "notice");
    }
    subscribeLeads();
    renderStats();
  }, error => { if (version === sessionVersion) message($("#dashboard-message"), errorKey(error)); });
}

async function saveProfile(event) {
  event.preventDefault();
  if (!profile || !currentUser) return;
  const values = new FormData(event.currentTarget);
  const update = {
    fullName: String(values.get("fullName") || "").trim(),
    phone: normalizePhone(values.get("phone")),
    city: String(values.get("city") || ""),
    categories: profile.role === "pro" ? values.getAll("categories") : [],
    bio: String(values.get("bio") || "").trim()
  };
  let validation;
  if (update.fullName.length < 2 || update.fullName.length > 80) validation = "errors.required";
  else if (!update.phone) validation = "errors.phone";
  else if (!CITIES.includes(update.city)) validation = "errors.city";
  else if (profile.role === "pro" && !update.categories.length) validation = "errors.categories";
  if (validation) { message($("#profile-message"), validation); return; }
  busy($("#profile-save"), true);
  try {
    await updateDoc(doc(db, "users", currentUser.uid), update);
    message($("#profile-message"), "dashboard.profileSaved", "success");
  } catch (error) { message($("#profile-message"), errorKey(error)); }
  finally { busy($("#profile-save"), false); }
}

function adminRow(pro) {
  const amountId = `credits-${pro.id}`;
  const amount = node("input", { type: "number", id: amountId, name: "amount", min: 1, max: 1000, step: 1, required: true, value: 3 });
  const addButton = node("button", { class: "btn btn-primary btn-sm", type: "submit", text: t("dashboard.loadCredits") });
  const creditForm = node("form", { class: "admin-credit-form" }, [
    node("div", { class: "field" }, [node("label", { for: amountId, text: t("dashboard.creditAmount") }), amount]), addButton
  ]);
  creditForm.addEventListener("submit", async event => {
    event.preventDefault();
    const credits = Number(amount.value);
    if (!Number.isInteger(credits) || credits < 1 || credits > 1000) { message($("#admin-message"), "errors.creditAmount"); return; }
    busy(addButton, true);
    try {
      await runTransaction(db, async transaction => {
        const reference = doc(db, "users", pro.id);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists() || snapshot.data().role !== "pro") throw appError("not-found");
        transaction.update(reference, { credits: snapshot.data().credits + credits });
      });
      message($("#admin-message"), "dashboard.adminSaved", "success");
      await loadAdmin();
    } catch (error) { message($("#admin-message"), errorKey(error)); }
    finally { busy(addButton, false); }
  });
  const featured = node("input", { type: "checkbox", name: "isFeatured", checked: pro.isFeatured });
  const verified = node("input", { type: "checkbox", name: "isVerified", checked: pro.isVerified });
  const date = node("input", { type: "date", name: "featuredUntil", id: `expiry-${pro.id}` });
  if (pro.featuredUntil?.toDate) {
    const value = pro.featuredUntil.toDate();
    date.value = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const save = node("button", { class: "btn btn-secondary btn-sm", type: "submit", text: t("common.save") });
  const settings = node("form", { class: "admin-controls" }, [
    node("label", { class: "check-label" }, [featured, t("dashboard.featured")]),
    node("div", { class: "field" }, [node("label", { for: date.id, text: t("dashboard.featuredUntil") }), date]),
    node("label", { class: "check-label" }, [verified, t("dashboard.verified")]), save
  ]);
  settings.addEventListener("submit", async event => {
    event.preventDefault();
    const expiry = date.value ? new Date(`${date.value}T23:59:59`) : null;
    if (featured.checked && (!expiry || !Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now())) {
      message($("#admin-message"), "errors.featuredUntil"); return;
    }
    busy(save, true);
    try {
      await updateDoc(doc(db, "users", pro.id), {
        isFeatured: featured.checked, isVerified: verified.checked,
        featuredUntil: featured.checked ? Timestamp.fromDate(expiry) : null
      });
      message($("#admin-message"), "dashboard.adminSaved", "success");
      await loadAdmin();
    } catch (error) { message($("#admin-message"), errorKey(error)); }
    finally { busy(save, false); }
  });
  return node("tr", {}, [
    node("td", {}, [node("strong", { text: pro.fullName }), node("p", { class: "help-text", text: t(`cities.${pro.city}`) })]),
    node("td", { text: formatNumber(pro.credits) }), node("td", {}, creditForm), node("td", {}, settings)
  ]);
}

async function moderateReview(review, button) {
  busy(button, true);
  try {
    await runTransaction(db, async transaction => {
      const reviewReference = doc(db, "reviews", review.id);
      const proReference = doc(db, "users", review.proId);
      const reviewSnapshot = await transaction.get(reviewReference);
      const proSnapshot = await transaction.get(proReference);
      if (!reviewSnapshot.exists() || !proSnapshot.exists()) throw appError("not-found");
      const existing = reviewSnapshot.data();
      const pro = proSnapshot.data();
      const nextApproved = !review.isApproved;
      if (existing.isApproved === nextApproved) return;
      const count = Math.max(0, pro.reviewCount + (nextApproved ? 1 : -1));
      const total = pro.ratingAvg * pro.reviewCount + (nextApproved ? existing.rating : -existing.rating);
      transaction.update(proReference, { reviewCount: count, ratingAvg: count ? Math.min(5, Math.max(1, total / count)) : 0 });
      transaction.update(reviewReference, { isApproved: nextApproved });
    });
    message($("#admin-message"), "dashboard.reviewSaved", "success");
    await loadAdmin();
  } catch (error) { message($("#admin-message"), errorKey(error)); }
  finally { busy(button, false); }
}

function renderAdmin() {
  $("#admin-pros").replaceChildren(...adminProfessionals.map(adminRow));
  $("#admin-reviews").replaceChildren(...adminReviews.map(review => {
    const button = node("button", { class: "btn btn-secondary", type: "button", text: t(review.isApproved ? "dashboard.unapprove" : "dashboard.approve") });
    button.addEventListener("click", () => moderateReview(review, button));
    const pro = adminProfessionals.find(entry => entry.id === review.proId);
    return node("article", { class: "lead-card" }, [
      node("h3", { text: `${pro?.fullName || review.proId} · ${review.rating} / 5` }),
      node("p", { class: "muted", text: review.customerName }), node("p", { text: review.comment }), button
    ]);
  }));
  if (!adminReviews.length) $("#admin-reviews").textContent = t("reviews.empty");
}

async function loadAdmin() {
  if (profile?.role !== "admin") return;
  const version = sessionVersion;
  busy($("#admin-refresh"), true);
  try {
    const [pros, reviews] = await Promise.all([
      getDocs(query(collection(db, "users"), where("role", "==", "pro"))),
      getDocs(collection(db, "reviews"))
    ]);
    if (version !== sessionVersion || profile?.role !== "admin") return;
    adminProfessionals = pros.docs.map(entry => ({ id: entry.id, ...entry.data() }));
    adminReviews = reviews.docs.map(entry => ({ id: entry.id, ...entry.data() })).sort((a, b) => Number(a.isApproved) - Number(b.isApproved));
    renderAdmin();
  } catch (error) { if (version === sessionVersion) message($("#admin-message"), errorKey(error)); }
  finally { busy($("#admin-refresh"), false); }
}

initI18n();
initShell();
document.addEventListener("hallet:session", event => updateSession(event.detail.user));
initAuth();
$("#profile-form").addEventListener("submit", saveProfile);
$("#admin-refresh").addEventListener("click", loadAdmin);
document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => selectTab(button.dataset.tab));
  button.addEventListener("keydown", event => {
    const tabs = Array.from(document.querySelectorAll("[data-tab]")).filter(tab => !tab.hidden);
    const index = tabs.indexOf(button);
    let next;
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs.at(-1);
    if (next) { event.preventDefault(); selectTab(next.dataset.tab, true); }
  });
});
$("#confirm-unlock").addEventListener("click", async event => {
  if (!selectedLead || unlocking) return;
  unlocking = true;
  const version = sessionVersion;
  const jobId = selectedLead;
  const button = event.currentTarget;
  busy(button, true);
  try {
    const phone = await unlockLead(jobId);
    if (version !== sessionVersion) return;
    contacts.set(jobId, phone);
    $("#unlock-dialog").close();
    renderLeads();
  } catch (error) { if (version === sessionVersion) message($("#unlock-message"), errorKey(error)); }
  finally { unlocking = false; busy(button, false); }
});
$("#unlock-dialog").addEventListener("cancel", event => { if (unlocking) event.preventDefault(); });
$("#privacy-button").addEventListener("click", () => openDialog($("#privacy-dialog")));
document.addEventListener("hallet:languagechange", () => {
  renderStats(); renderLeads();
  const selected = Array.from($("#profile-categories").querySelectorAll("input:checked"), input => input.value);
  renderCategoryChecks(selected);
  if (profile?.role === "admin") renderAdmin();
});
