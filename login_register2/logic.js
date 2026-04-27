 import { auth, db } from "../firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 1. AUTOMATIC REFERRAL ID DETECTION
// ==========================================
// Jab link register.html?ref=USER123 jaisa hoga to ye khud idr se uthayga
const urlParams = new URLSearchParams(window.location.search);
const referralFromLink = urlParams.get('ref');

// Jaise hi page load ho, agar link me ID hai to box me likh do
window.addEventListener('DOMContentLoaded', () => {
    const refInputBox = document.getElementById('referralInput');
    if (referralFromLink && refInputBox) {
        refInputBox.value = referralFromLink;
        // Isay 'readonly' rakha hai taky user change na kr saky
        refInputBox.readOnly = true; 
    }
});

// ==========================================
// 2. REGISTRATION LOGIC (With 4 Boxes)
// ==========================================
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const pass = document.getElementById('regPass').value;
        const finalRef = document.getElementById('referralInput').value; // Automatic box se lega

        // Phone number ko backend ke liye email format me badalna
        const email = phone + "@fastcash.com";

        try {
            // User banayein Auth me
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            // User ka poora data Firestore me save karein
            await setDoc(doc(db, "users", user.uid), {
                fullName: name,
                phoneNumber: phone,
                globalBalance: 0,
                referralBalance: 0,
                paidReferralCount: 0,
                isPaid: false, // Account approve hone tak false rahy ga
                referredBy: finalRef || "Direct", // Agar koi link ni to "Direct" likha jayga
                uid: user.uid,
                timestamp: serverTimestamp()
            });

            alert("Mubarak ho! Account ban gaya hai. Ab login karein.");
            window.location.href = "login.html";

        } catch (error) {
            console.error(error);
            alert("Registration Fail: " + error.message);
        }
    };
}

// ==========================================
// 3. LOGIN LOGIC
// ==========================================
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.onsubmit = async (e) => {
        e.preventDefault();

        const phone = document.getElementById('logPhone').value;
        const pass = document.getElementById('logPass').value;
        const email = phone + "@fastcash.com";

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // Login k baad dashboard folder se bahar hai to ../ lage ga
            window.location.href = "../dashboard/dashboard.html";
        } catch (error) {
            alert("Ghalat Phone ya Password! Dubara koshish karein.");
        }
    };
}