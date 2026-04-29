 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

if (!userPhone) { window.location.href = "../login/login.html"; }

// --- 1. Immediate Link Generation ---
const setInitialLink = () => {
    const tempID = userPhone.slice(-4); 
    const linkBox = document.getElementById("referralLink");
    linkBox.value = `${window.location.origin}/registration/signup.html?ref=${tempID}`;
};
setInitialLink();

// --- 2. Real-time Global Sync ---
onSnapshot(doc(db, "users", userPhone), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Permanent UID Update
        const myUID = data.uid || userPhone.slice(-4);
        document.getElementById("referralLink").value = `${window.location.origin}/registration/signup.html?ref=${myUID}`;

        // Progress Bar Sync
        const paidRefs = data.paidReferralCount || 0;
        document.getElementById("refStatusText").innerText = `${paidRefs} / 4 Referrals`;
        
        let progress = (paidRefs / 4) * 100;
        document.getElementById("refProgressBar").style.width = `${Math.min(progress, 100)}%`;

        // Withdraw Status Connection
        const statusLabel = document.getElementById("withdrawStatusLabel");
        if (paidRefs >= 4 || data.withdrawUnlocked) {
            statusLabel.innerHTML = '<i class="fa-solid fa-unlock"></i> WITHDRAW UNLOCKED';
            statusLabel.className = "status-badge unlocked";
        } else {
            statusLabel.innerHTML = `<i class="fa-solid fa-lock"></i> Need ${4 - paidRefs} more referrals`;
            statusLabel.className = "status-badge locked";
        }
    }
});

// --- 3. Functions ---
window.copyRefLink = () => {
    const link = document.getElementById("referralLink");
    link.select();
    navigator.clipboard.writeText(link.value);
    document.getElementById("copyBtn").innerHTML = "Copied!";
    setTimeout(() => { document.getElementById("copyBtn").innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; }, 2000);
};

window.shareOnWhatsApp = () => {
    const link = document.getElementById("referralLink").value;
    window.open(`https://wa.me/?text=${encodeURIComponent("Join MoneyLogic and Earn: " + link)}`, '_blank');
};

window.shareOnFacebook = () => {
    const link = document.getElementById("referralLink").value;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
};

window.downloadBackup = async () => {
    const docSnap = await getDoc(doc(db, "users", userPhone));
    const blob = new Blob([JSON.stringify(docSnap.data(), null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `MoneyLogic_Backup_${userPhone}.json`;
    a.click();
};