import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, increment, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// --- MAIN LOGIC: DATABASE SYNC ---

onAuthStateChanged(auth, async (user) => {
    const linkInput = document.getElementById("referralLinkInput");
    
    if (user) {
        console.log("User detected, fetching database ID...");
        
        // 1. Database se user ka document nikalna (Lambi UID use karke)
        const userRef = doc(db, "users", user.uid); 
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const officialID = userData.uid; // Ye wahi 4-digit ya numeric ID hai

            // 2. Link ko sahi path ke sath set karna (FASTCASH REPO ADDED)
            const correctLink = `https://paycashofficial22-web.github.io/fastcash/login_register2/register.html?ref=${officialID}`;
            linkInput.value = correctLink;
            
            console.log("Link updated successfully: ", officialID);

            // 3. Stats update karna numeric ID se
            setupLiveStats(officialID);
        } else {
            linkInput.value = "User data not found in Database";
        }
    } else {
        linkInput.value = "Please Login first!";
    }
});

// --- LIVE STATS FUNCTION ---
function setupLiveStats(numericID) {
    const q = query(collection(db, "users"), where("uid", "==", numericID.toString().trim()));
    
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            const refs = data.paidReferralCount || 0;
            const bonus = data.referralBalance || 0;

            document.getElementById("refCountText").innerText = `${refs} / 4`;
            document.getElementById("bonusAmount").innerText = `PKR ${bonus}.00`;
            
            let width = (refs / 4) * 100;
            const progressBar = document.getElementById("referralProgress");
            if(progressBar) progressBar.style.width = (width > 100 ? 100 : width) + "%";

            if (refs >= 4) {
                const btn = document.getElementById("withdrawLockedBtn");
                if(btn) {
                    btn.disabled = false;
                    btn.classList.replace("locked", "unlocked");
                    btn.innerHTML = '<i class="fa-solid fa-unlock"></i> 😎🎊Congratulation';
                }
            }
        }
    });
}

// --- SECURE BONUS LOGIC ---
window.approveUserAndGiveBonus = async (userB_DocID) => {
    const userBRef = doc(db, "users", userB_DocID);
    const userBSnap = await getDoc(userBRef);

    if (userBSnap.exists()) {
        const userB = userBSnap.data();
        if (userB.isReferralPaid === false && userB.referredBy) {
            const qA = query(collection(db, "users"), where("uid", "==", userB.referredBy));
            const querySnapA = await getDocs(qA);

            if (!querySnapA.empty) {
                const userADoc = querySnapA.docs[0];
                const userARef = doc(db, "users", userADoc.id);
                await updateDoc(userARef, {
                    referralBalance: increment(40),
                    paidReferralCount: increment(1)
                });
                await updateDoc(userBRef, { isReferralPaid: true });
                alert("Bonus updated successfully!");
            }
        }
    }
};

// --- UTILS ---
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
};