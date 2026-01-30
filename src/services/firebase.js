import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDZ8N6MUUkt-eyI2rNRcYSVswpuKV7xBCU",
  authDomain: "gaiatrace.firebaseapp.com",
  projectId: "gaiatrace",
  storageBucket: "gaiatrace.firebasestorage.app",
  messagingSenderId: "439909329082",
  appId: "1:439909329082:web:82c58c3994387f604f7a83",
  measurementId: "G-VL5W9LCQFK",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Phone auth helper: create reCAPTCHA in a container id (e.g. "recaptcha")
export function ensureRecaptcha(containerId){
  if(window.__gaia_recaptcha) return window.__gaia_recaptcha;
  window.__gaia_recaptcha = new RecaptchaVerifier(auth, containerId, {
    size: "normal",
  });
  return window.__gaia_recaptcha;
}
