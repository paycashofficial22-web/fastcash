 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const userPhone = localStorage.getItem("userPhone");

let isUnlocked = false; 
let userBalance = 0;

// --- Step 1: Data Sync (Real-time) ---
onSnapshot(doc(db, "users", userPhone), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        const referrals = data.paidReferralCount || 0;
        userBalance = data.globalBalance || 0;

        const percentage = (referrals / 4) * 100;
        document.getElementById("progressBar").style.width = Math.min(percentage, 100) + "%";
        
        if (referrals >= 4) {
            isUnlocked = true;
            document.getElementById("statusHeading").innerText = "Network Verified";
            document.getElementById("statusSubtext").innerText = "Your account is eligible for withdrawal.";
            document.getElementById("lockIcon").style.color = "#10b981";
        } else {
            isUnlocked = false;
            document.getElementById("statusHeading").innerText = `Progress: ${referrals}/4 Referrals`;
            document.getElementById("statusSubtext").innerText = `Complete ${4 - referrals} more referrals to unlock.`;
            document.getElementById("lockIcon").style.color = "#ef4444";
        }
    }
});

// --- Step 2: Main Logic (Connect to Button) ---
window.processWithdraw = async () => {
    const amtInput = document.getElementById("amount").value;
    const acc = document.getElementById("accountNumber").value;
    const mtd = document.getElementById("method").value;
    const amt = parseFloat(amtInput);

    console.log("Process started..."); // Debugging ke liye

    // 1. Referral Check (Sabse Pehle)
    if (!isUnlocked) {
        alert("❌ Withdraw Nakamyab! Pehle 4 referrals mukammal karein, tab hi aap withdraw kar sakte hain.");
        return;
    }

    // 2. Input Fields Check
    if (!acc || acc.length < 10) {
        alert("⚠️ Please apna sahi mobile number enter karein.");
        return;
    }

    if (!amtInput || isNaN(amt) || amt < 500) {
        alert("⚠️ Kam az kam withdraw amount Rs. 500 honi chahiye.");
        return;
    }

    // 3. Balance Check
    if (amt > userBalance) {
        alert(`❌ Aapke paas kafi balance nahi hai! Aapka moajuda balance Rs. ${userBalance} hai.`);
        return;
    }

    // 4. Everything is OK - Send Request
    try {
        const btn = document.getElementById("submitBtn");
        btn.disabled = true; // Double click se bachne ke liye
        btn.innerText = "Processing...";

        await addDoc(collection(db, "withdrawRequests"), {
            phone: userPhone,
            withdrawNumber: acc,
            method: mtd,
            amount: amt,
            status: "pending",
            timestamp: new Date()
        });

        // Balance minus kar dena
        await updateDoc(doc(db, "users", userPhone), {
            globalBalance: increment(-amt)
        });

        alert("✅ Aapki request bhj di gi ha, please intezar kry shukria.");
        window.location.href = "dashboard.html";

    } catch (e) {
        console.error(e);
        alert("❌ System busy hai. Dobara koshish karein.");
        document.getElementById("submitBtn").disabled = false;
        document.getElementById("submitBtn").innerText = "Confirm Cashout";
    }
};