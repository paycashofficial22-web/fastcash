 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, increment, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 1. UNIQUE ID GENERATION (3040, 5826 style)
let myID = localStorage.getItem("userPhone");
if (!myID) {
    myID = Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem("userPhone", myID);
}

// 2. LIVE DASHBOARD UPDATES
const q = query(collection(db, "users"), where("uid", "==", myID.trim()));
onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const refs = data.paidReferralCount || 0;
        const bonus = data.referralBalance || 0;

        document.getElementById("refCountText").innerText = `${refs} / 4`;
        document.getElementById("bonusAmount").innerText = `PKR ${bonus}.00`;
        
        let width = (refs / 4) * 100;
        document.getElementById("referralProgress").style.width = (width > 100 ? 100 : width) + "%";

        if (refs >= 4) {
            const btn = document.getElementById("withdrawLockedBtn");
            btn.disabled = false;
            btn.classList.replace("locked", "unlocked");
            btn.innerHTML = '<i class="fa-solid fa-unlock"></i> 😎🎊Congratulation';
        }
    }
});

// 3. SECURE BONUS LOGIC (Automated & One-time)
// Ye function tab chalayen jab aap User B ka balance manually update karein
window.approveUserAndGiveBonus = async (userB_DocID) => {
    const userBRef = doc(db, "users", userB_DocID);
    const userBSnap = await getDoc(userBRef);

    if (userBSnap.exists()) {
        const userB = userBSnap.data();

        // Security Check: Status false hona chahiye aur Referrer ID honi chahiye
        if (userB.isReferralPaid === false && userB.referredBy) {
            const qA = query(collection(db, "users"), where("uid", "==", userB.referredBy));
            const querySnapA = await getDocs(qA);

            if (!querySnapA.empty) {
                const userADoc = querySnapA.docs[0];
                const userARef = doc(db, "users", userADoc.id);

                // User A ko 40 PKR dein aur count +1 karein
                await updateDoc(userARef, {
                    referralBalance: increment(40),
                    paidReferralCount: increment(1)
                });

                // User B ko true mark kar dein taake dobara bonus na mile
                await updateDoc(userBRef, { isReferralPaid: true });
                alert("User A received 40 PKR bonus! Securely updated.");
            }
        }
    }
};

// 4. LINK & SOCIAL
document.getElementById("referralLinkInput").value = `https://paycashofficial22-web.github.io/signup.html?ref=${myID}`;

window.copyLink = () => {
    const input = document.getElementById("referralLinkInput");
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("Link Copied!");
};

window.share = (p) => {
    const link = document.getElementById("referralLinkInput").value;
    const msg = encodeURIComponent("Fast Cash join karein aur har refer pe 40rs kamayein! " + link);
    if(p === 'wa') window.open(`https://wa.me/?text=${msg}`);
    if(p === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`);
    if(p === 'ig') alert("Bio mein link paste karein!");
};