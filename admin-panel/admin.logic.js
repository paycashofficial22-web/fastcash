 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, updateDoc, deleteDoc, addDoc, getDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let currentUserId = null;

// Navigation Logic
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('open');
window.showSection = (id) => {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(window.innerWidth < 768) toggleSidebar();
};

// 1. Fetch Users & Update Cards
onSnapshot(collection(db, "users"), (snap) => {
    const list = document.getElementById('user-list');
    list.innerHTML = "";
    let totalFunds = 0;
    let paidCount = 0;
    
    document.getElementById('stat-total-users').innerText = snap.size;
    document.getElementById('stat-total-tx').innerText = snap.size; // Simulated Total TX

    snap.forEach(d => {
        const u = d.data();
        totalFunds += Number(u.globalBalance || 0);
        if(u.isPaid) paidCount++;

        list.innerHTML += `<tr>
            <td>${u.fullName || 'N/A'}</td>
            <td>${u.phoneNumber}</td>
            <td><code>${u.password || '****'}</code></td>
            <td style="font-weight:bold">Rs. ${u.globalBalance}</td>
            <td>${u.paidReferralCount || 0}</td>
            <td style="color:${u.isPaid ? 'green':'red'}"><b>${u.isPaid ? 'PAID':'UNPAID'}</b></td>
            <td><button onclick="openEditModal('${d.id}')" class="btn-success" style="padding:5px 10px">Edit</button></td>
        </tr>`;
    });
    document.getElementById('stat-total-funds').innerText = "Rs. " + totalFunds;
    document.getElementById('stat-paid-users').innerText = paidCount;
});

// 2. Fetch Deposits
onSnapshot(collection(db, "depositRequests"), (snap) => {
    const list = document.getElementById('deposit-list');
    list.innerHTML = "";
    document.getElementById('stat-deposit-req').innerText = snap.size;
    snap.forEach(d => {
        const r = d.data();
        list.innerHTML += `<tr>
            <td>${r.fullName}</td>
            <td>Rs. ${r.amount}</td>
            <td style="color:blue">${r.transactionId}</td>
            <td>
                <button onclick="approveDep('${d.id}', '${r.uid}', ${r.amount})" class="btn-success">✓</button>
                <button onclick="deleteData('depositRequests', '${d.id}')" class="btn-danger">X</button>
            </td>
        </tr>`;
    });
});

// 3. Fetch Withdrawals
onSnapshot(collection(db, "withdrawRequests"), (snap) => {
    const list = document.getElementById('withdraw-list');
    list.innerHTML = "";
    document.getElementById('stat-withdraw-req').innerText = snap.size;
    snap.forEach(d => {
        const r = d.data();
        list.innerHTML += `<tr>
            <td>${r.fullName}</td>
            <td>Rs. ${r.amount}</td>
            <td>${r.method}: ${r.accountNumber}</td>
            <td><button onclick="deleteData('withdrawRequests', '${d.id}')" class="btn-success">Paid</button></td>
        </tr>`;
    });
});

// 4. Edit/Delete Actions
window.openEditModal = async (id) => {
    currentUserId = id;
    const docSnap = await getDoc(doc(db, "users", id));
    if(docSnap.exists()){
        const u = docSnap.data();
        document.getElementById('display-name').innerText = u.fullName;
        document.getElementById('edit-name').value = u.fullName || "";
        document.getElementById('edit-phone').value = u.phoneNumber || "";
        document.getElementById('edit-pass').value = u.password || "";
        document.getElementById('edit-balance').value = u.globalBalance || 0;
        document.getElementById('edit-ref').value = u.paidReferralCount || 0;
        document.getElementById('editModal').style.display = 'flex';
    }
};

window.closeModal = () => document.getElementById('editModal').style.display = 'none';

window.updateUser = async () => {
    await updateDoc(doc(db, "users", currentUserId), {
        fullName: document.getElementById('edit-name').value,
        phoneNumber: document.getElementById('edit-phone').value,
        password: document.getElementById('edit-pass').value,
        globalBalance: Number(document.getElementById('edit-balance').value),
        paidReferralCount: Number(document.getElementById('edit-ref').value)
    });
    alert("Updated!");
    closeModal();
};

window.deleteUserAccount = async () => {
    if(confirm("Permanently delete this user?")){
        await deleteDoc(doc(db, "users", currentUserId));
        alert("Deleted!");
        closeModal();
    }
};

window.approveDep = async (rid, uid, amt) => {
    await updateDoc(doc(db, "users", uid), { globalBalance: increment(amt), isPaid: true });
    await deleteDoc(doc(db, "depositRequests", rid));
    alert("Approved!");
};

window.deleteData = async (col, id) => {
    if(confirm("Are you sure?")) await deleteDoc(doc(db, col, id));
};

window.sendGlobal = async () => {
    const m = document.getElementById('global-msg').value;
    if(!m) return;
    await addDoc(collection(db, "notifications"), { target: "all", title: "Admin Message", message: m, time: serverTimestamp() });
    alert("Sent!");
    document.getElementById('global-msg').value = "";
};