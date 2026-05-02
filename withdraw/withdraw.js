import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, addDoc, collection, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
let referralsCount = 0; 
let currentUserID = null;

// --- Step 1: Auth & Data Sync ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserID = user.uid;
        onSnapshot(doc(db, "users", currentUserID), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                referralsCount = data.paidReferralCount || 0; 
                userBalance = data.globalBalance || 0;

                const percentage = (referralsCount / 4) * 100;
                const progressBar = document.getElementById("progressBar");
                if(progressBar) progressBar.style.width = Math.min(percentage, 100) + "%";
                
                const statusH = document.getElementById("statusHeading");
                const statusS = document.getElementById("statusSubtext");
                const lockI = document.getElementById("lockIcon");

                if (referralsCount >= 4) {
                    isUnlocked = true;
                    if(statusH) statusH.innerText = "Network Verified ✅";
                    if(statusS) statusS.innerText = "Your account is eligible for withdrawal.";
                    if(lockI) {
                        lockI.className = "fas fa-check-circle";
                        lockI.style.color = "#10b981";
                    }
                } else {
                    isUnlocked = false;
                    if(statusH) statusH.innerText = `Progress: ${referralsCount}/4 Referrals`;
                    if(statusS) statusS.innerText = `Complete ${4 - referralsCount} more referrals to unlock.`;
                    if(lockI) {
                        lockI.className = "fas fa-lock";
                        lockI.style.color = "#ef4444";
                    }
                }

                if(document.getElementById('total-bal')) document.getElementById('total-bal').innerText = userBalance;
                if(document.getElementById('with-bal')) document.getElementById('with-bal').innerText = userBalance;
            }
        });
    } else {
        window.location.href = "../login.html";
    }
});

// --- Step 2: Withdraw Logic ---
window.processWithdraw = async () => {
    const amtInput = document.getElementById("amount");
    const accNumInput = document.getElementById("accountNumber");
    const methodInput = document.getElementById("method");
    const submitBtn = document.getElementById("submitBtn");

    if(!amtInput || !accNumInput) return;

    const amount = parseFloat(amtInput.value);
    const account = accNumInput.value;
    const method = methodInput ? methodInput.value : "EasyPaisa";

    if (!isUnlocked) {
        const remaining = 4 - referralsCount;
        alert(`⚠️ Withdraw Locked!\n\nAapko mazeed ${remaining} active referrals ki zaroorat hai.\n\nJaise hi aapke 4 referrals poore honge, aap paise nikal sakenge. Shukria! ✅`);
        return;
    }

    if (!account || account.length < 10) {
        alert("⚠️ Please apna sahi mobile number enter karein.");
        return;
    }

    if (isNaN(amount) || amount < 500) {
        alert("⚠️ Kam az kam withdraw Rs. 500 hona chahiye.");
        return;
    }

    if (amount > userBalance) {
        alert(`❌ Insufficient Balance!\nAapka balance Rs. ${userBalance} hai. Please kam amount likhein.`);
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing...";

        // --- Fetch User Name specifically for Admin Panel ---
        const userDoc = await getDoc(doc(db, "users", currentUserID));
        const fullName = userDoc.exists() ? userDoc.data().fullName : "Unknown";

        // 4. Request send karein (Ab User Name bhi jayega)
        await addDoc(collection(db, "withdrawRequests"), {
            uid: currentUserID,
            userName: fullName, // UID ki jagah Naam save hoga
            accountNumber: account,
            method: method,
            amount: amount,
            status: "pending",
            timestamp: new Date()
        });

        // 5. Balance Minus karein
        await updateDoc(doc(db, "users", currentUserID), {
            globalBalance: increment(-amount)
        });

        alert("✅ Aapki request bhj di gi ha, please intezar kry shukria.");
        window.location.href = "../dashboard/dashboard.html";

    } catch (e) {
        console.error(e);
        alert("❌ Error! System busy hai, dobara koshish karein.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Confirm Cashout";
    }
};