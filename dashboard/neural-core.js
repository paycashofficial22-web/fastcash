


  // =========================================================================
// --- FULL FILE: neural-core.js (MINING CORE, VISUALS & MATH LOGIC) ---
// =========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. APNI FIREBASE KEYS YAHAN PASTE KAREIN (ZAROORI) ---
// ***************************************************************
 const firebaseConfig = {
     apiKey: "AIzaSyBic-MxXkb4vG_gijQlZCn7Lh8BERP1M9g",
  authDomain: "moneylogic2026-fa88f.firebaseapp.com",
  projectId: "moneylogic2026-fa88f",
  storageBucket: "moneylogic2026-fa88f.firebasestorage.app",
  messagingSenderId: "511787870430",
  appId: "1:511787870430:web:39d538fdfef74ba5cd7a4f"

};
// ***************************************************************

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Variables k calculator aur sync connect rehain
window.userGlobalBalance = 0; // connects with dashboard global var
let isMiningActive = false;
let miningInterval;

// --- 2. GLOBAL REAL-TIME BALANCE SYNC (Database -> Dashboard) ---
// Corrected field name conflict from image_15.png
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Neural Core synced for:", user.uid);
        const userRef = doc(db, "users", user.uid);
        
        // Live Database Listener
        onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                
                // mathematical formula logic applies from database value
                // Connect with ID from image_7.png
                window.userGlobalBalance = parseFloat(data.globalBalance || 0);
                
                // Dashboard Header Display update (PKR 0.00 area)
                const totalBalEl = document.getElementById('totalBalance');
                if(totalBalEl) {
                    totalBalEl.innerText = "PKR " + window.userGlobalBalance.toFixed(2);
                }
                
                // --- B: Mining State Sync on refresh (Episode 2 persistence) ---
                if(data.lockupActive && !isMiningActive) {
                    resumeMiningUI(data.lockupEndTime, data.lockedAmount);
                } else if (!data.lockupActive && isMiningActive) {
                    resetMiningUI();
                }
            }
        });
    }
});

// =========================================================
// --- 3. EPISODE 2: MINING MATH & FIREBASE LOGIC ---
// =========================================================

// A. LOCKUP FUNCTION (Cut funds and start timer)
window.handleLockup = async () => {
    console.log("Lock Button Clicked!");
    const inputEl = document.getElementById('lockAmount');
    const amount = parseInt(inputEl.value);

    // Mathematical Validations and calculator formulas
    if (isMiningActive) return alert("Pehle se mining active hai!");
    if (!amount || amount < 300) return alert("Min 300 PKR lock karein.");
    
    // Check global variables for sufficiency math logic
    if (amount > window.userGlobalBalance) {
        return alert(`In-sufficient balance! Aapke pass PKR ${window.userGlobalBalance} hain.`);
    }

    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        // Formula for duration: Current time + 24 Hours in milliseconds
        const endTime = Date.now() + (24 * 60 * 60 * 1000); 

        // FIREBASE WRITE: Actual deduction and activating core
        // actual mathematical logic applied from calculator formula
        await updateDoc(userRef, {
            globalBalance: window.userGlobalBalance - amount, // REAL DEDUCTION Math Logic
            lockupActive: true,
            lockedAmount: amount,
            lockupEndTime: endTime
        });

        alert("Neural Core started! PKR " + amount + " dashboard se nikal liye gaye hain.");
        inputEl.value = "";
    } catch (e) {
        console.error("Lockup Error:", e);
        alert("Lockup failed: " + e.message);
    }
};

// B. CLAIM FUNCTION (Calculate mathematical profit and add to balance)
window.handleClaim = async () => {
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();

        // Security check math logic: has time really passed?
        if (Date.now() < data.lockupEndTime) return alert("Still mining... Timer khatam hone dain!");

        // 1. PROFIT RATE MATH FORMULA (Tiering logic formula applied)
        let rate = data.lockedAmount >= 10000 ? 1.0 : data.lockedAmount >= 5000 ? 0.6 : 0.4;
        let lockedVal = data.lockedAmount;
        let mathematicalProfit = lockedVal * rate;
        let mathematicalTotalReturn = lockedVal + mathematicalProfit; // Profit formula logic

        console.log(`Locked: ${lockedVal}, Rate: ${rate}, Total Return Formula: ${mathematicalTotalReturn}`);

        // 2. FIREBASE WRITE: Add profit to global dashboard
        await updateDoc(userRef, {
            globalBalance: window.userGlobalBalance + mathematicalTotalReturn, // REAL ADDITION Math Logic
            lockupActive: false,
            lockedAmount: 0,
            lockupEndTime: null
        });

        alert("Profit Claimed! PKR " + mathematicalTotalReturn.toFixed(2) + " dashboard balance me add ho gaye hain.");
        location.reload(); 
    } catch (e) {
        alert("Claim failed: " + e.message);
    }
};

// =========================================================
// --- 4. VISUALS & UI HELPERS (Active Core) ---
// =========================================================

function resumeMiningUI(endTime, amount) {
    isMiningActive = true;
    
    // Core Active Visual Model (Electric effects image_0.png)
    document.getElementById('neuralCoreCard').classList.add('active-core');
    
    // Dashboard fields connects (image_1.png models)
    document.getElementById('lockedDisp').innerText = amount;
    
  // Sahi Lines (Line 154-156 replacement):

const profitDispEl = document.getElementById('profitDisp'); // % logic target
let mathematicalRate = amount >= 10000 ? 100 : amount >= 5000 ? 60 : 40;
if (profitDispEl) profitDispEl.innerText = mathematicalRate + "%"; // mathematical profit visualization

    // Disable Calculator lock buttons
    document.getElementById('lockBtn').disabled = true;
    document.getElementById('lockBtn').innerText = "CORE ACTIVE";

    // Timer Interval logic... (Calculates mathematical countdown)
    clearInterval(miningInterval);
    miningInterval = setInterval(() => {
        let gap = endTime - Date.now();

        // 1. Progress Bar Visualization (mathematical formula logic)
        let duration = 24 * 60 * 60 * 1000;
        let percent = ((duration - gap) / duration) * 100;
        document.getElementById('neuralProgress').style.width = percent + "%";

        // 2. Time Countdown Mathematical check (h:m:s)
        const h = Math.floor(gap / 3600000);
        const m = Math.floor((gap % 3600000) / 60000);
        const s = Math.floor((gap % 60000) / 1000);

        const timerEl = document.getElementById('neuralTimer');
        timerEl.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

        // 3. Profit generated mathematical check
        if (gap <= 0) {
            clearInterval(miningInterval);
            isMiningActive = false;
            document.getElementById('claimBtn').disabled = false;
            timerEl.innerText = "COMPLETED";
            timerEl.style.color = "#10b981"; // Emerald Green
        }
    }, 1000); // 1 sec refresh rate logic
}

function resetMiningUI() {
    isMiningActive = false;
    clearInterval(miningInterval);
    document.getElementById('neuralCoreCard').classList.remove('active-core');
    document.getElementById('lockBtn').disabled = false;
    document.getElementById('lockBtn').innerText = "Lock Assets";
    document.getElementById('claimBtn').disabled = true;
}