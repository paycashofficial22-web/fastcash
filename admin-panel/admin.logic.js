 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBic-MxXkb4vG_gijQlZCn7Lh8BERP1M9g",
    authDomain: "moneylogic2026-fa88f.firebaseapp.com",
    projectId: "moneylogic2026-fa88f",
    storageBucket: "moneylogic2026-fa88f.appspot.com",
    messagingSenderId: "511787870430",
    appId: "1:511787870430:web:39d538fdfef74ba5cd7a4f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let allUsers = [];

// 1. Live Listeners for Data & Stats
onSnapshot(collection(db, "users"), (snapshot) => {
    allUsers = [];
    let depositTotal = 0;
    let paidCount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        allUsers.push(data);
        if(data.isPaid) {
            paidCount++;
            depositTotal += (data.globalBalance || 0);
        }
    });

    // Update Stats
    document.getElementById('totalDeposits').innerText = `Rs. ${depositTotal}`;
    document.getElementById('totalPaidUsers').innerText = paidCount;
    document.getElementById('totalMembers').innerText = allUsers.length;
    
    renderTable(allUsers);
});

// 2. Render User Table
function renderTable(data) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    data.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td>${user.fullName}</td>
                <td>${user.phoneNumber}</td>
                <td>Rs. ${user.globalBalance || 0}</td>
                <td>${user.paidReferralCount || 0}</td>
                <td><b style="color:${user.isPaid ? 'green':'red'}">${user.isPaid ? 'PAID':'PENDING'}</b></td>
                <td>
                    ${!user.isPaid ? `<button onclick="approveUser('${user.id}')" class="btn-approve">Approve</button>` : ''}
                    <button onclick="openEditModal('${user.id}')" class="btn-icon btn-edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteUser('${user.id}')" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// Line 64 se shuru karein (Purana code hata kar ye dalein)
window.sendGlobalNotification = async () => {
    const msg = document.getElementById('globalMsg').value;
    if(!msg) return alert("Kuch message toh likhein!");

    try {
        const broadcastRef = doc(db, "settings", "announcements");
        
        // setDoc automatic collection aur document bana dega
        await setDoc(broadcastRef, {
            currentMsg: msg,
            msgId: Date.now().toString(), 
            timestamp: new Date()
        });
        
        alert("Zabardast! Sab users ko notification chala gaya.");
        document.getElementById('globalMsg').value = '';
    } catch (e) {
        console.error("Error:", e);
        alert("Opps! Connection check karein.");
    }
};

// 4. Approval Logic
window.approveUser = async (id) => {
    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    await updateDoc(userRef, { isPaid: true, globalBalance: 800 });

    if(userData.referredBy) {
        const refRef = doc(db, "users", userData.referredBy);
        const refSnap = await getDoc(refRef);
        if(refSnap.exists()) {
            await updateDoc(refRef, { 
                paidReferralCount: (refSnap.data().paidReferralCount || 0) + 1,
                referralBonusCard: (refSnap.data().referralBonusCard || 0) + 33
            });
        }
    }
    alert("User Approved and Referral Updated!");
};

// 5. Edit Modal Controls
window.openEditModal = (id) => {
    const user = allUsers.find(u => u.id === id);
    document.getElementById('editUserId').value = id;
    document.getElementById('editName').value = user.fullName;
    document.getElementById('editBalance').value = user.globalBalance || 0;
    document.getElementById('editRefCount').value = user.paidReferralCount || 0;
    document.getElementById('userPersonalMsg').value = user.personalMsg || '';
    document.getElementById('editModal').style.display = 'block';
};

window.saveUserChanges = async () => {
    const id = document.getElementById('editUserId').value;
    await updateDoc(doc(db, "users", id), {
        fullName: document.getElementById('editName').value,
        globalBalance: Number(document.getElementById('editBalance').value),
        paidReferralCount: Number(document.getElementById('editRefCount').value),
        personalMsg: document.getElementById('userPersonalMsg').value
    });
    alert("Updated!");
    closeModal();
};

window.deleteUser = async (id) => {
    if(confirm("🚨 DELETE PERMANENTLY?")) {
        await deleteDoc(doc(db, "users", id));
        alert("User Deleted!");
    }
};

window.closeModal = () => document.getElementById('editModal').style.display = 'none';

// Search Filter
document.getElementById('userSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.fullName.toLowerCase().includes(term) || u.phoneNumber.includes(term)
    );
    renderTable(filtered);
});