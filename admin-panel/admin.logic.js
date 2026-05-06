 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, updateDoc, deleteDoc, query, where, getDocs, increment, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let currentEditId = null;
let currentDeleteId = null; // Delete ke liye

// --- DYNAMIC STATS UPDATER ---
onSnapshot(collection(db, "users"), s => {
    if(document.getElementById("countUsers")) document.getElementById("countUsers").innerText = s.size;
});
onSnapshot(collection(db, "depositRequests"), s => {
    if(document.getElementById("countDeposits")) document.getElementById("countDeposits").innerText = s.size;
});
onSnapshot(collection(db, "withdrawRequests"), s => {
    if(document.getElementById("countWithdraws")) document.getElementById("countWithdraws").innerText = s.size;
});

// --- GLOBAL MESSAGE SENDER (Naya Function) ---
document.getElementById("sendGlobalBtn").addEventListener("click", async () => {
    const msg = document.getElementById("globalMsgText").value;
    if(!msg) return alert("Please enter a message!");
    
    try {
        await addDoc(collection(db, "notifications"), {
            message: msg,
            target: "all",
            status: "unread",
            senderName: "Admin",
            timestamp: serverTimestamp()
        });
        document.getElementById("globalMsgText").value = "";
        alert("Global Message Sent to All Users! ✅");
    } catch(e) { console.error(e); }
});

// --- MAIN VIEW LOADER ---
window.loadView = (view) => {
    const tHead = document.getElementById("tHead");
    const tBody = document.getElementById("tBody");
    const title = document.getElementById("viewTitle");
    tBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Loading data...</td></tr>";

    if (view === 'deposits') {
        title.innerText = "Deposit Approval Queue";
        tHead.innerHTML = `<tr><th>User UID</th><th>Amt</th><th>Method</th><th>TRX ID</th><th>Actions</th></tr>`;
        onSnapshot(collection(db, "depositRequests"), (snap) => {
            tBody.innerHTML = "";
            snap.forEach(d => {
                const r = d.data();
                tBody.innerHTML += `<tr class="data-row">
                    <td><span class="badge-id searchable">${r.uid || 'N/A'}</span></td>
                    <td><b>Rs. ${r.amount || 0}</b></td>
                    <td>${r.method || 'N/A'}</td>
                    <td><code class="searchable">${r.transactionID || 'No ID'}</code></td>
                    <td>
                        <button class="btn-action btn-approve" onclick="approveDeposit('${d.id}', '${r.uid}', ${r.amount}, '${r.method}', '${r.transactionID}')">Approve</button>
                        <button class="btn-action btn-delete" onclick="rejectDeposit('${d.id}', '${r.uid}', ${r.amount}, '${r.method}', '${r.transactionID}')">Reject</button>
                    </td>
                </tr>`;
            });
        });
    } 
    else if (view === 'withdrawals') {
        title.innerText = "Pending Withdrawal Requests";
        tHead.innerHTML = `<tr><th>User Name</th><th>Amt</th><th>Method</th><th>Account Details</th><th>Actions</th></tr>`;
        onSnapshot(collection(db, "withdrawRequests"), (snap) => {
            tBody.innerHTML = "";
            if (snap.empty) tBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No pending withdraws.</td></tr>";
            snap.forEach(d => {
                const w = d.data();
                tBody.innerHTML += `<tr class="data-row">
                    <td><b>${w.userName || 'No Name'}</b><br><small>${w.uid || ''}</small></td>
                    <td><b style="color:red;">Rs. ${w.amount || 0}</b></td>
                    <td>${w.method || 'N/A'}</td>
                    <td><code class="searchable">${w.accountNumber || 'No No.'}</code></td>
                    <td>
                        <button class="btn-action btn-approve" onclick="approveWithdraw('${d.id}', '${w.uid}', ${w.amount}, '${w.method}', '${w.userName}')">Done</button>
                        <button class="btn-action btn-delete" onclick="rejectWithdraw('${d.id}', '${w.uid}', ${w.amount}, '${w.method}', '${w.userName}')">Reject & Refund</button>
                    </td>
                </tr>`;
            });
        });
    }
    else {
        title.innerText = "Full User Management Console";
        tHead.innerHTML = `<tr><th>User Name / UID</th><th>Phone</th><th>Balance</th><th>Team</th><th>Status</th><th>Actions</th></tr>`;
        onSnapshot(collection(db, "users"), (snap) => {
            tBody.innerHTML = "";
            snap.forEach(d => {
                const u = d.data();
                tBody.innerHTML += `<tr class="data-row">
                    <td><b>${u.fullName || 'No Name'}</b><br><small class="badge-id searchable">${u.uid}</small></td>
                    <td><span class="searchable">${u.phoneNumber || 'N/A'}</span></td>
                    <td><b>Rs. ${Number(u.globalBalance || 0)}</b></td>
                    <td><span class="badge-active">${u.paidReferralCount || 0}/4</span></td>
                    <td>${u.isPaid ? '<span class="badge-active">✅ Active</span>' : '<span class="badge-unpaid">❌ Unpaid</span>'}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="openEditModal('${d.id}', ${u.globalBalance || 0}, '${u.uid}')">Edit</button>
                        <button class="btn-action btn-delete" onclick="openDeleteModal('${d.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            });
        });
    }
};

// --- PRIVATE MESSAGE & BALANCE UPDATE (Naya Logic Integration) ---
window.openEditModal = (id, cur, uid) => { 
    currentEditId = id; 
    window.currentEditUserUID = uid; // UID ko save kar liya
    document.getElementById("newBalanceField").value = cur; 
    document.getElementById("privateMsgField").value = ""; // Clear old message
    document.getElementById("editModal").style.display = "flex"; 
};

document.getElementById("saveBalanceBtn").addEventListener("click", async () => {
    const val = Number(document.getElementById("newBalanceField").value);
    const msg = document.getElementById("privateMsgField").value;
    const uid = window.currentEditUserUID;

    try {
        // 1. Balance Update
        await updateDoc(doc(db, "users", currentEditId), { globalBalance: val });

        // 2. Private Message Send (Agar likha hai to)
        if(msg.trim() !== "") {
            await addDoc(collection(db, "notifications"), {
                message: msg,
                target: uid,
                status: "unread",
                senderName: "Admin",
                timestamp: serverTimestamp()
            });
        }

        closeModal(); 
        alert("Update Successful! ✅");
    } catch(e) { console.error(e); }
});

// --- DELETE USER FUNCTIONS (Naya) ---
window.openDeleteModal = (id) => {
    currentDeleteId = id;
    document.getElementById("deleteModal").style.display = "flex";
};
window.closeDeleteModal = () => document.getElementById("deleteModal").style.display = "none";

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    try {
        await deleteDoc(doc(db, "users", currentDeleteId));
        closeDeleteModal();
        alert("User Deleted Successfully!");
    } catch(e) { console.error(e); }
});

// --- BAQI OLD LOGIC (Deposit/Withdraw - NO CHANGE) ---
window.approveWithdraw = async (docId, uid, amount, method, name) => {
    if(confirm("Confirm: Kya aapne user ko paise bhej diye hain?")) {
        try {
            await addDoc(collection(db, "transactions"), {
                uid: uid, userName: name, amount: amount, type: "Withdraw", status: "Success", method: method, timestamp: serverTimestamp()
            });
            await deleteDoc(doc(db, "withdrawRequests", docId));
            alert("Withdrawal marked as completed!");
        } catch (e) { console.error(e); }
    }
};

window.rejectWithdraw = async (docId, uid, amount, method, name) => {
    if(confirm("Reject aur refund karna chahte hain?")) {
        try {
            await updateDoc(doc(db, "users", uid), { globalBalance: increment(Number(amount)) });
            await addDoc(collection(db, "transactions"), {
                uid: uid, userName: name, amount: amount, type: "Withdraw", status: "Failed", method: method, timestamp: serverTimestamp()
            });
            await deleteDoc(doc(db, "withdrawRequests", docId));
            alert("Rejected & Refunded!");
        } catch (e) { console.error(e); }
    }
};

window.approveDeposit = async (docId, userUid, amount, method, trx) => {
    try {
        const uQuery = query(collection(db, "users"), where("uid", "==", userUid));
        const userSnap = await getDocs(uQuery);
        if (!userSnap.empty) {
            const userRef = userSnap.docs[0].ref;
            const userData = userSnap.docs[0].data();
            await updateDoc(userRef, { globalBalance: increment(Number(amount)), isPaid: true });
            await addDoc(collection(db, "transactions"), {
                uid: userUid, userName: userData.fullName, amount: amount, type: "Deposit", status: "Success", trxId: trx, timestamp: serverTimestamp()
            });
            await deleteDoc(doc(db, "depositRequests", docId));
            alert("Deposit Approved!");
        }
    } catch (e) { console.error(e); }
};

window.rejectDeposit = async (docId, uid, amount, method, trx) => {
    if(confirm("Reject this deposit?")) {
        await addDoc(collection(db, "transactions"), {
            uid: uid, amount: amount, type: "Deposit", status: "Failed", trxId: trx, timestamp: serverTimestamp()
        });
        await deleteDoc(doc(db, "depositRequests", docId));
        alert("Deposit Rejected!");
    }
};

window.closeModal = () => document.getElementById("editModal").style.display = "none";

loadView('users');