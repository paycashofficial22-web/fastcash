import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Firebase Config (Aapki keys)
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

// 2. Auth Check
const userPhone = localStorage.getItem("userPhone");
if (!userPhone) {
    window.location.href = "../login/login.html";
}

// 3. Real-time Dashboard Sync
onSnapshot(doc(db, "users", userPhone), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // --- Referral Link Generation (Using UID) ---
        const myUID = data.uid || "1000"; // Unique ID (Phone number chupa rahega)
        const baseUrl = window.location.origin;
        // Link template
        const myReferralLink = `${baseUrl}/registration/signup.html?ref=${myUID}`;
        document.getElementById("referralLink").value = myReferralLink;

        // --- Progress Tracker (Only counting Paid Referrals) ---
        const paidRefs = data.paidReferralCount || 0;
        document.getElementById("refStatusText").innerText = `${paidRefs} / 4 Referrals Paid`;
        
        let progressPercent = (paidRefs / 4) * 100;
        if (progressPercent > 100) progressPercent = 100;
        document.getElementById("refProgressBar").style.width = `${progressPercent}%`;

        // --- Unlock Logic ---
        const statusLabel = document.getElementById("withdrawStatusLabel");
        if (data.withdrawUnlocked) {
            statusLabel.innerHTML = '<i class="fa-solid fa-unlock"></i> Withdraw Unlocked';
            statusLabel.className = "status-badge unlocked";
        } else {
            const remaining = 4 - paidRefs;
            statusLabel.innerHTML = `<i class="fa-solid fa-lock"></i> Need ${remaining} More Paid Users`;
            statusLabel.className = "status-badge locked";
        }
    }
});

// 4. Social Sharing & Functions
window.copyRefLink = () => {
    const copyText = document.getElementById("referralLink");
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    
    const btn = document.getElementById("copyBtn");
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
};

window.shareOnWhatsApp = () => {
    const link = document.getElementById("referralLink").value;
    const msg = encodeURIComponent(`MoneyLogic join karein aur daily profit kamayein! Mera link: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
};

window.shareOnFacebook = () => {
    const link = document.getElementById("referralLink").value;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
};