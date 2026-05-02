import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

let isUnlocked = false; 
let userBalance = 0;
let currentUserID = null;

// --- Step 1: Auth & Data Sync (No LocalStorage) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserID = user.uid; // Direct Firebase ID use hogi
        
        // Real-time listener taake database change hote hi UI update ho
        onSnapshot(doc(db, "users", currentUserID), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const referrals = data.paidReferralCount || 0;
                userBalance = data.globalBalance || 0;

                // UI Update logic
                const percentage = (referrals / 4) * 100;
                const progressBar = document.getElementById("progressBar");
                if(progressBar) progressBar.style.width = Math.min(percentage, 100) + "%";
                
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
                
                // Balance display update
                if(document.getElementById('total-bal')) document.getElementById('total-bal').innerText = userBalance;
                if(document.getElementById('with-bal')) document.getElementById('with-bal').innerText = userBalance;
            }
        });
    } else {
        window.location.href = "../login.html"; // Agar login nahi to bahr nikaal do
    }
});

// --- Step 2: Withdraw Logic ---
window.processWithdraw = async () => {
    const amtInput = document.getElementById("withdraw-amount").value;
    const accName = document.getElementById('acc-name').value;
    const accNum = document.getElementById('acc-num').value;
    const mtd = document.getElementById("method") ? document.getElementById("method").value : "EasyPaisa";
    const amt = parseFloat(amtInput);

    // 1. Referral Gate Check
    if (!isUnlocked) {
        alert("❌ Withdraw Nakamyab! Pehle 4 referrals mukammal karein, tab hi aap withdraw kar sakte hain.");
        return;
    }

    // 2. Security & Validation
    if (!accNum || accNum.length < 10 || accName.trim() === "") {
        alert("⚠️ Please account ki sahi details enter karein.");
        return;
    }

    if (!amtInput || isNaN(amt) || amt < 500) {
        alert("⚠️ Kam az kam withdraw amount Rs. 500 honi chahiye.");
        return;
    }

    // 3. Live Balance Check
    if (amt > userBalance) {
        alert(`❌ Aapke paas kafi balance nahi hai! Aapka moajuda balance Rs. ${userBalance} hai.`);
        return;
    }

    try {
        const btn = document.getElementById("submitBtn");
        if(btn) {
            btn.disabled = true;
            btn.innerText = "Processing...";
        }

        // 4. Request Create karna
        await addDoc(collection(db, "withdrawRequests"), {
            uid: currentUserID,
            accountName: accName,
            accountNumber: accNum,
            method: mtd,
            amount: amt,
            status: "pending",
            timestamp: new Date()
        });

        // 5. Database Balance Update
        await updateDoc(doc(db, "users", currentUserID), {
            globalBalance: increment(-amt)
        });

        alert("✅ Aapki request bhj di gi ha, please intezar kry shukria.");
        window.location.href = "../dashboard/dashboard.html";

    } catch (e) {
        console.error("Withdraw Error:", e);
        alert("❌ System busy hai. Dobara koshish karein.");
        const btn = document.getElementById("submitBtn");
        if(btn) {
            btn.disabled = false;
            btn.innerText = "Confirm Cashout";
        }
    }
};