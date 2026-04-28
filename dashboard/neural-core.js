 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const LOCK_DURATION = 24 * 60 * 60 * 1000;
const PROFIT_PERCENT = 0.36;

// UI Elements
const mainBalanceEl = document.getElementById('main-balance');
const lockInputArea = document.getElementById('lock-input-area');
const activeLockArea = document.getElementById('active-lock-area');
const liveProfitEl = document.getElementById('live-profit');
const timerEl = document.getElementById('timer-display');
const claimBtn = document.getElementById('claim-btn');
const lockBtn = document.getElementById('lock-start-btn');

let timerInterval;

onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                
                // FIXED: 'balance' ki jagah 'globalBalance' use kiya hai jo apke Firebase mein hai
                const currentBalance = Number(userData.globalBalance) || 0; 
                
                if(mainBalanceEl) mainBalanceEl.innerText = "PKR " + currentBalance.toFixed(2);

                if (userData.ep2_status === "active") {
                    startExperience(userData);
                } else {
                    stopExperience();
                }
            }
        });
    }
});

function startExperience(data) {
    lockInputArea.style.display = "none";
    activeLockArea.style.display = "block";
    document.getElementById('display-locked-amount').innerText = data.ep2_locked;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = LOCK_DURATION - (now - data.ep2_startTime);

        if (timeLeft > 0) {
            const timePassedProportion = (now - data.ep2_startTime) / LOCK_DURATION;
            const currentProfit = (Number(data.ep2_locked) * PROFIT_PERCENT) * timePassedProportion;
            liveProfitEl.innerText = currentProfit.toFixed(5);

            const hours = Math.floor(timeLeft / 3600000);
            const mins = Math.floor((timeLeft % 3600000) / 60000);
            const secs = Math.floor((timeLeft % 60000) / 1000);
            timerEl.innerText = `${hours}h ${mins}m ${secs}s`;
            
            claimBtn.disabled = true;
            claimBtn.classList.remove('active');
        } else {
            clearInterval(timerInterval);
            liveProfitEl.innerText = (Number(data.ep2_locked) * PROFIT_PERCENT).toFixed(2);
            timerEl.innerText = "Completed!";
            claimBtn.disabled = false;
            claimBtn.classList.add('active');
        }
    }, 1000);
}

function stopExperience() {
    lockInputArea.style.display = "block";
    activeLockArea.style.display = "none";
    if (timerInterval) clearInterval(timerInterval);
}

lockBtn.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('amount-to-lock').value);
    const user = auth.currentUser;

    if (!user) return alert("Pehle login karein!");
    if (isNaN(amount) || amount < 300) return alert("Minimum 300 PKR lock karein!");

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const userData = snap.data();
    
    // FIXED: Yahan bhi 'globalBalance' read ho raha hai
    const currentBalance = Number(userData.globalBalance) || 0;

    if (currentBalance < amount) {
        return alert("Balance kam hai! Apka current balance " + currentBalance + " PKR hai.");
    }

    try {
        await updateDoc(userRef, {
            globalBalance: currentBalance - amount, // Global se raqam cut
            ep2_locked: amount,
            ep2_startTime: Date.now(),
            ep2_status: "active"
        });
        alert("Success! Balance cut ho gaya aur model start ho gaya.");
    } catch (err) {
        alert("Error: " + err.message);
    }
});

claimBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const userData = snap.data();

    const profit = Number(userData.ep2_locked) * PROFIT_PERCENT;
    const totalReturn = Number(userData.ep2_locked) + profit;
    const currentBalance = Number(userData.globalBalance) || 0;

    try {
        await updateDoc(userRef, {
            globalBalance: currentBalance + totalReturn, // Wapas Global mein add
            ep2_locked: 0,
            ep2_status: "idle",
            ep2_startTime: null
        });
        alert("Mubarak! Profit apke global balance mein add ho gaya.");
    } catch (err) {
        alert("Error: " + err.message);
    }
});