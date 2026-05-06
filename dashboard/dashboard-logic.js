 /* ============================================================
   FIREBASE FULL LOGIC ENGINE
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, collection, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBic-MxXkb4vG_gijQlZCn7Lh8BERP1M9g",
  authDomain: "moneylogic2026-fa88f.firebaseapp.com",
  projectId: "moneylogic2026-fa88f",
  storageBucket: "moneylogic2026-fa88f.firebasestorage.app",
  messagingSenderId: "511787870430",
  appId: "1:511787870430:web:39d538fdfef74ba5cd7a4f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- SIDEBAR CONTROL ---
window.toggleSidebar = () => {
    const sidebar = document.getElementById('mySidebar');
    const menuBtn = document.getElementById('menuToggle');
    
    sidebar.classList.toggle('active');
    
    // Toggle Icon Animation
    if(sidebar.classList.contains('active')) {
        menuBtn.classList.replace('fa-th-large', 'fa-times');
        menuBtn.style.color = "#fff";
    } else {
        menuBtn.classList.replace('fa-times', 'fa-th-large');
        menuBtn.style.color = "var(--primary-blue)";
    }
};

// --- PROFILE EDIT NAME ---
window.editName = async () => {
    const newName = prompt("Apna Naya Naam Type Karein:");
    if (newName && auth.currentUser) {
        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { fullName: newName });
            alert("✅ Naam Update Ho Gaya!");
        } catch (e) { alert("❌ Error: " + e.message); }
    }
};

// --- LIVE DATA SYNC ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
             // Dashboard Updates
        document.getElementById('sideName').innerText = data.fullName;
        document.getElementById('sidePhone').innerText = data.phoneNumber;
        document.getElementById('totalBalance').innerText = `PKR ${data.globalBalance || 0}.00`;
        document.getElementById('refCount').innerText = `${data.paidReferralCount} / 4`;
        document.getElementById('refEarning').innerText = `PKR ${data.referralBalance}.00`;
            }
        });
    } else {
        window.location.href = "auth/login.html";
    }
});

// --- LOGOUT SYSTEM START ---
// Line Check: Ye code file ke end mein add karein
document.getElementById('logoutBtn').onclick = (e) => {
    e.preventDefault(); // Page ko foran refresh hone se rokne ke liye
    
    if(confirm("Kya aap waqai logout karna chahte hain?")) {
        signOut(auth).then(() => {
            // Logout kamyabi se ho gaya, ab login page par bhejein
            // Note: Path ka khayal rakhein (../ kyunke login file folder ke andar hai)
            window.location.href = "../login_register2/login.html"; 
        }).catch((error) => {
            alert("Logout Error: " + error.message);
        });
    }
};
// --- LOGOUT SYSTEM END ---



// DASHBOARD LOGIC KE END PE YE FUNCTIONS DAL EIN
window.openDeposit = () => {
    document.getElementById('depositContainer').style.display = 'flex';
    document.querySelector('.main-content').style.filter = 'blur(10px)';
};

window.closeDeposit = () => {
    document.getElementById('depositContainer').style.display = 'none';
    document.querySelector('.main-content').style.filter = 'none';
};


/* EPISODE 2 logic */


/* --- REAL-TIME NOTIFICATION COUNTER START --- */
 
 

// Sirf wo messages check karein jo "unread" hain
const q = query(collection(db, "notifications"), where("status", "==", "unread"));

onSnapshot(q, (snapshot) => {
    const badge = document.getElementById("notif-count");
    const count = snapshot.size;

    if (count > 0) {
        // Agar message hai to count dikhao aur badge show karo
        badge.innerText = count;
        badge.style.display = "flex"; 
    } else {
        // Agar koi unread message nahi hai to badge chhupa do
        badge.style.display = "none";
    }
});
/* --- REAL-TIME NOTIFICATION COUNTER END --- */