import {
  auth, db, isFirebaseConfigured, requireFirebase, googleProvider,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, sendPasswordResetEmail, signOut, doc, runTransaction,
  serverTimestamp, normalizePhone
} from "./firebase-config.js";
import { t, CITIES, CATEGORY_IDS, translatePage } from "./i18n.js";
import { $, node, message, errorKey, busy, openDialog } from "./shared.js";

let profileRole = "customer";
let mode = "login";
let pending = false;
let initialized = false;
export let currentUser = null;

function formData() {
  const form = $("#auth-form");
  const values = new FormData(form);
  const data = {
    fullName: String(values.get("fullName") || "").trim(),
    phone: normalizePhone(values.get("phone")),
    city: String(values.get("city") || ""),
    categories: values.getAll("categories"),
    bio: String(values.get("bio") || "").trim(),
    role: profileRole
  };
  if (mode === "register") {
    if (data.fullName.length < 2 || data.fullName.length > 80) throw { code: "form/required" };
    if (!data.phone) throw { code: "form/phone" };
    if (data.role === "pro" && !CITIES.includes(data.city)) throw { code: "form/city" };
    if (data.role === "pro" && !data.categories.some(category => CATEGORY_IDS.includes(category))) {
      throw { code: "form/categories" };
    }
  }
  return data;
}

async function ensureProfile(user, details = null) {
  const reference = doc(db, "users", user.uid);
  await runTransaction(db, async transaction => {
    const existing = await transaction.get(reference);
    if (existing.exists()) return;
    const role = details?.role === "pro" ? "pro" : "customer";
    transaction.set(reference, {
      fullName: details?.fullName || user.displayName?.slice(0, 80) || user.email?.split("@")[0]?.slice(0, 80) || "HALLET",
      phone: details?.phone || "",
      role,
      city: details?.city || "",
      categories: role === "pro" ? details.categories : [],
      bio: details?.bio || "",
      credits: role === "pro" ? 3 : 0,
      isVerified: false,
      isFeatured: false,
      featuredUntil: null,
      ratingAvg: 0,
      reviewCount: 0,
      whatsappClicks: 0,
      createdAt: serverTimestamp()
    });
  });
}

function renderMode() {
  const registering = mode === "register";
  $("#auth-title").textContent = t(registering ? "auth.registerTitle" : "auth.loginTitle");
  $("#auth-submit").textContent = t(registering ? "auth.create" : "nav.login");
  $("#registration-fields").hidden = !registering;
  $("#pro-registration-fields").hidden = !registering || profileRole !== "pro";
  $("#auth-password").autocomplete = registering ? "new-password" : "current-password";
  $("#auth-password").minLength = registering ? 8 : 1;
  document.querySelectorAll("[data-auth-mode]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.authMode === mode));
  });
  $("#auth-role").value = profileRole;
  const selected = new Set(Array.from($("#auth-categories").querySelectorAll("input:checked"), input => input.value));
  $("#auth-categories").replaceChildren(...CATEGORY_IDS.map(category => node("label", { class: "check-label" }, [
    node("input", { type: "checkbox", name: "categories", value: category, checked: selected.has(category) }),
    node("span", { text: t(`categories.${category}`) })
  ])));
}

export function showAuth(nextMode = "login", role = "customer") {
  if (pending) return;
  mode = nextMode === "register" ? "register" : "login";
  profileRole = role === "pro" ? "pro" : "customer";
  message($("#auth-message"));
  renderMode();
  openDialog($("#auth-dialog"));
}

function showAuthError(error) {
  const key = String(error?.code || "").startsWith("form/")
    ? `errors.${error.code.slice(5)}` : errorKey(error);
  message($("#auth-message"), key);
}

async function authenticate(provider = "email") {
  if (pending) return;
  pending = true;
  $("#auth-dialog").querySelectorAll("button, input, select, textarea").forEach(input => {
    input.dataset.wasDisabled = String(input.disabled);
  });
  busy($("#auth-submit"), true);
  busy($("#auth-google"), true);
  message($("#auth-message"));
  try {
    requireFirebase();
    const details = mode === "register" ? formData() : null;
    let credential;
    if (provider === "google") {
      credential = await signInWithPopup(auth, googleProvider);
    } else {
      const email = $("#auth-email").value.trim();
      const password = $("#auth-password").value;
      if (!email || !$("#auth-email").checkValidity()) throw { code: "form/email" };
      if (!password || (mode === "register" && password.length < 8)) throw { code: "form/password" };
      credential = mode === "register"
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    }
    await ensureProfile(credential.user, details);
    $("#auth-password").value = "";
    $("#auth-dialog").close();
    document.dispatchEvent(new CustomEvent("hallet:authenticated", { detail: { user: credential.user } }));
  } catch (error) {
    showAuthError(error);
  } finally {
    pending = false;
    busy($("#auth-submit"), false);
    busy($("#auth-google"), false);
  }
}

export function initAuth() {
  if (initialized) return;
  initialized = true;
  document.querySelectorAll("[data-open-auth]").forEach(button => {
    button.addEventListener("click", () => showAuth(button.dataset.openAuth, button.dataset.role));
  });
  document.querySelectorAll("[data-auth-mode]").forEach(button => {
    button.addEventListener("click", () => {
      if (pending) return;
      mode = button.dataset.authMode;
      renderMode();
      message($("#auth-message"));
    });
  });
  $("#auth-role").addEventListener("change", event => {
    profileRole = event.target.value;
    renderMode();
  });
  $("#auth-form").addEventListener("submit", event => {
    event.preventDefault();
    authenticate();
  });
  $("#auth-google").addEventListener("click", () => authenticate("google"));
  $("#forgot-password").addEventListener("click", async event => {
    const button = event.currentTarget;
    busy(button, true);
    try {
      requireFirebase();
      const email = $("#auth-email").value.trim();
      if (!email || !$("#auth-email").checkValidity()) throw { code: "form/email" };
      await sendPasswordResetEmail(auth, email);
      message($("#auth-message"), "auth.resetSent", "success");
    } catch (error) {
      showAuthError(error);
    } finally {
      busy(button, false);
    }
  });
  document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", async () => {
      busy(button, true);
      try { await signOut(auth); }
      catch (error) { showAuth("login"); showAuthError(error); }
      finally { busy(button, false); }
    });
  });
  document.addEventListener("hallet:languagechange", renderMode);
  const updateSession = user => {
    currentUser = user;
    document.querySelectorAll("[data-guest-only]").forEach(element => { element.hidden = Boolean(user); });
    document.querySelectorAll("[data-user-only]").forEach(element => { element.hidden = !user; });
    document.dispatchEvent(new CustomEvent("hallet:session", { detail: { user } }));
  };
  if (isFirebaseConfigured && auth) onAuthStateChanged(auth, updateSession, () => updateSession(null));
  else updateSession(null);
  translatePage($("#auth-dialog"));
  renderMode();
}
