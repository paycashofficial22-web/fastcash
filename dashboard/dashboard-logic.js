 // --- 1. FIREBASE SETUP & IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBic-MxXkb4vG_gijQlZCn7Lh8BERP1M9g",
  authDomain: "moneylogic2026-fa88f.firebaseapp.com",
  databaseURL: "https://moneylogic2026-fa88f-default-rtdb.firebaseio.com",
  projectId: "moneylogic2026-fa88f",
  storageBucket: "moneylogic2026-fa88f.firebasestorage.app",
  messagingSenderId: "511787870430",
  appId: "1:511787870430:web:39d538fdfef74ba5cd7a4f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. GLOBAL STATE ---
let currentData = null; 
const userPhone = localStorage.getItem("userPhone");

if (!userPhone) {
    window.location.href = "../login_register2/login.html";
}

// --- 3. UI UPDATES ---

function updateMainDashboard(data) {
    // Balance Fields (Aapki Firebase IDs ke mutabiq)
    document.getElementById("userBalancePro").innerText = `PKR ${parseFloat(data.globalBalance || 0).toFixed(2)}`;
    document.getElementById("referralBalancePro").innerText = `PKR ${parseFloat(data.referralBalance || 0).toFixed(2)}`;
    document.getElementById("dailyBonusPro").innerText = `PKR ${parseFloat(data.dailyBonus || 0).toFixed(2)}`;
    document.getElementById("userNameDisplay").innerText = data.fullName || "User";
}

function updateVaultEngine(data) {
    if (!data.isLocked || !data.lockedAt) {
        resetVaultUI();
        return;
    }

    const now = Date.now();
    const lockTime = data.lockedAt;
    const totalMs = 24 * 60 * 60 * 1000; // 24 Hours
    const msPassed = now - lockTime;

    let progress = (msPassed / totalMs) * 100;
    if (progress > 100) progress = 100;

    // Profit Calculation (10% Daily)
    const dailyProfitRate = 0.10; 
    const currentProfit = (data.lockedAmount * dailyProfitRate) * (progress / 100);

    // UI Updates
    const profitArc = document.getElementById("profitArc");
    if (profitArc) profitArc.style.strokeDasharray = `${progress}, 100`;

    document.getElementById("profitPercent").innerText = `${progress.toFixed(1)}%`;
    document.getElementById("liveProfitRs").innerText = `${currentProfit.toFixed(2)}rs`;
    document.getElementById("vaultProfitDisplay").innerText = `PKR ${currentProfit.toFixed(2)}`;
    document.getElementById("lockedAmountDisplay").innerText = `PKR ${data.lockedAmount}.00`;

    const claimBtn = document.getElementById("claimBtn");
    const lockIcon = document.getElementById("lockIcon");

    if (progress >= 100) {
        claimBtn.classList.remove("hidden");
        if(lockIcon) {
            lockIcon.innerText = "🔓";
            lockIcon.classList.add("shining-lock");
        }
    } else {
        if(claimBtn) claimBtn.classList.add("hidden");
        if(lockIcon) lockIcon.innerText = "🔒";
    }
}

function resetVaultUI() {
    document.getElementById("profitPercent").innerText = "0%";
    document.getElementById("liveProfitRs").innerText = "0.00rs";
    document.getElementById("vaultProfitDisplay").innerText = "PKR 0.00";
    document.getElementById("lockedAmountDisplay").innerText = "PKR 0.00";
    const arc = document.getElementById("profitArc");
    if (arc) arc.style.strokeDasharray = "0, 100";
}

// --- 4. ACTION HANDLERS ---

// --- Lock Money Function with Security ---
window.handleLockAction = async () => {
    const amountInput = document.getElementById("lockAmountInput");
    const amount = parseFloat(amountInput.value);

    // 1. Check: User ne register ke baad deposit kiya hai?
    // 1. Check: Kya user ke paas balance hai? (Real-time check)
// Line 95 par ye logic dalien:
if (currentData && (currentData.globalBalance || 0) < amount) {
    alert("Error: Apka balance nakafi hai! Pehle deposit karein.");
    return;
}
    // 2. Check: Kya pehle se koi amount lock hai?
    if (currentData && currentData.isLocked === true) {
        alert("Error: Apka ek lockup pehle se active hai! 24 ghante baad hi dobara lock kar sakty hain.");
        return; 
    }

    // 3. Check: 300 Minimum Limit & Valid Amount
    if (!amount || isNaN(amount) || amount < 300) {
        alert("Error: Kam az kam 300 PKR lock karna zaroori hai!");
        return;
    }

    // 4. Check: Balance kaafi hai? (Ye main security hai)
    if (currentData.globalBalance < amount) {
        alert("Error: Apka balance nakafi hai! Pehle deposit karein.");
        return;
    }

    // Saari checks pass: Ab Firebase update karein
    try {
        const userRef = doc(db, "users", userPhone);
        await updateDoc(userRef, {
            globalBalance: currentData.globalBalance - amount,
            lockedAmount: amount,
            isLocked: true,
            lockedAt: Date.now() 
        });
        
        alert("Mubarak ho! PKR " + amount + " successfully lock ho gaye hain.");
        amountInput.value = ""; 
    } catch (e) {
        console.error("Lock Error:", e);
        alert("Server error, dobara koshish karein.");
    }
};

// --- Claim Profit Function ---
window.claimProfitAction = async () => {
    if (!currentData || !currentData.isLocked) return;

    const dailyProfitRate = 0.10;
    const profit = currentData.lockedAmount * dailyProfitRate;

    try {
        const userRef = doc(db, "users", userPhone);
        await updateDoc(userRef, {
            globalBalance: currentData.globalBalance + currentData.lockedAmount + profit,
            isLocked: false,
            lockedAmount: 0,
            lockedAt: null
        });
        alert("Profit aur Locked Amount apke balance mein add kar di gayi hai!");
    } catch (e) {
        alert("Claim error!");
    }
};

// --- 5. LISTENERS & INITIALIZATION ---

onSnapshot(doc(db, "users", userPhone), (docSnap) => {
    if (docSnap.exists()) {
        currentData = docSnap.data();
        updateMainDashboard(currentData);
        updateVaultEngine(currentData);
    }
});

setInterval(() => {
    if (currentData && currentData.isLocked) {
        updateVaultEngine(currentData);
    }
}, 1000);

// --- LOGOUT LOGIC ---
window.logoutUser = () => {
    if (confirm("Kya aap logout karna chahte hain?")) {
        localStorage.removeItem("userPhone");
        window.location.href = "../login_register2/login.html";
    }
};

const logBtn = document.getElementById("logoutBtn");
if (logBtn) logBtn.onclick = () => logoutUser();


// dashboard-logic.js
// dashboard-logic.js ke aakhir mein ye paste karein

const dot = document.getElementById('notiBadge'); 

if (userPhone && dot) {
    // Ye line user ke apne document ko listen karegi
    onSnapshot(doc(db, "users", userPhone), (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            const lastSeen = localStorage.getItem("lastSeenMsg");

            // Agar Admin wala message aur purana saved message alag hain, to dot dikhao
            if (userData.globalNotification && userData.globalNotification !== lastSeen) {
                dot.style.display = 'block'; 
            } else {
                dot.style.display = 'none'; 
            }
        }
    });
}