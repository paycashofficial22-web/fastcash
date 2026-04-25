// Firebase SDKs import karna (CDN version jo browser mein chalta hai)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Aapki provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyBic-MxXkb4vG_gijQlZCn7Lh8BERP1M9g",
  authDomain: "moneylogic2026-fa88f.firebaseapp.com",
  projectId: "moneylogic2026-fa88f",
  storageBucket: "moneylogic2026-fa88f.firebasestorage.app",
  messagingSenderId: "511787870430",
  appId: "1:511787870430:web:39d538fdfef74ba5cd7a4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Database aur Auth ko export karna taake logic files mein use ho sakein
export const db = getFirestore(app);
export const auth = getAuth(app);