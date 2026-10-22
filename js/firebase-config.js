import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  runTransaction,
  writeBatch,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const firebaseConfig = Object.freeze({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
});

export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
].every(value => typeof value === "string" && value.trim().length > 0);

let app = null;
let auth = null;
let db = null;
let initializationError = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    initializationError = error;
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function requireFirebase() {
  if (initializationError) throw initializationError;
  if (!app || !auth || !db) {
    const error = new Error("Firebase bağlantı bilgileri tanımlanmadı.");
    error.code = "hallet/firebase-not-configured";
    throw error;
  }
  return { app, auth, db };
}

export function normalizePhone(value) {
  const input = String(value ?? "").trim();
  if (!/^\+?[\d\s().-]+$/.test(input)) return "";
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `90${digits}`;
  return /^90(?:533|548)8\d{6}$/.test(digits) ? digits : "";
}

export function formatPhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return "—";
  const local = phone.slice(2);
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
}

export function maskPhone(value) {
  const phone = normalizePhone(value);
  return phone ? `0${phone.slice(2, 5)} ${phone[5]}** ** ${phone.slice(-2)}` : "—";
}

export {
  app, auth, db, initializationError, googleProvider,
  onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signInWithPopup,
  sendPasswordResetEmail, updateProfile, signOut,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp,
  increment, arrayUnion, runTransaction, writeBatch, Timestamp
};
