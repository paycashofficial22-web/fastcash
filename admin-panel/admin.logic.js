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

// --- DYNAMIC STATS UPDATER (Same as before) ---
onSnapshot(collection(db, "users"), s => {
    if(document.getElementById("countUsers")) document.getElementById("countUsers").innerText = s.size;
});
onSnapshot(collection(db, "depositRequests"), s => {
    if(document.getElementById("countDeposits")) document.getElementById("countDeposits").innerText = s.size;
});
onSnapshot(collection(db, "withdrawRequests"), s => {
    if(document.getElementById("countWithdraws")) document.getElementById("countWithdraws").innerText = s.size;
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
        tHead.innerHTML = `<tr><th>User Name / UID</th><th>Phone</th><th>Balance</th><th>Team (Paid)</th><th>Status</th><th>Actions</th></tr>`;
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
                    <td><button class="btn-action btn-edit" onclick="openEditModal('${d.id}', ${u.globalBalance || 0})">Edit</button></td>
                </tr>`;
            });
        });
    }
};

// --- UPDATED WITHDRAW LOGIC (Connects to History) ---
window.approveWithdraw = async (docId, uid, amount, method, name) => {
    if(confirm("Confirm: Kya aapne user ko paise bhej diye hain?")) {
        try {
            // Save to Transactions History
            await addDoc(collection(db, "transactions"), {
                uid: uid, userName: name, amount: amount, type: "Withdraw", status: "Success", method: method, timestamp: serverTimestamp()
            });
            await deleteDoc(doc(db, "withdrawRequests", docId));
            alert("Withdrawal marked as completed & History updated!");
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
            alert("Rejected, Balance Refunded & History updated!");
        } catch (e) { console.error(e); }
    }
};

// --- UPDATED DEPOSIT LOGIC (Connects to History) ---
window.approveDeposit = async (docId, userUid, amount, method, trx) => {
    try {
        const uQuery = query(collection(db, "users"), where("uid", "==", userUid));
        const userSnap = await getDocs(uQuery);
        if (!userSnap.empty) {
            const userRef = userSnap.docs[0].ref;
            const userData = userSnap.docs[0].data();
            
            // Balance update logic
            if (userData.isPaid === false) {
                await updateDoc(userRef, { globalBalance: increment(Number(amount)), isPaid: true });
                // Referral logic... (kept as is)
            } else {
                await updateDoc(userRef, { globalBalance: increment(Number(amount)) });
            }

            // Save to Transaction History
            await addDoc(collection(db, "transactions"), {
                uid: userUid, userName: userData.fullName, amount: amount, type: "Deposit", status: "Success", trxId: trx, timestamp: serverTimestamp()
            });

            await deleteDoc(doc(db, "depositRequests", docId));
            alert("Deposit Approved & History updated!");
        }
    } catch (e) { console.error(e); }
};

window.rejectDeposit = async (docId, uid, amount, method, trx) => {
    if(confirm("Are you sure you want to REJECT this deposit?")) {
        await addDoc(collection(db, "transactions"), {
            uid: uid, amount: amount, type: "Deposit", status: "Failed", trxId: trx, timestamp: serverTimestamp()
        });
        await deleteDoc(doc(db, "depositRequests", docId));
        alert("Deposit Rejected & History updated!");
    }
};

// --- UTILITY FUNCTIONS (Modal/Delete - Kept same) ---
window.deleteEntry = async (c, id) => { if(confirm("Are you sure?")) await deleteDoc(doc(db, c, id)); };
window.openEditModal = (id, cur) => { currentEditId = id; document.getElementById("newBalanceField").value = cur; document.getElementById("editModal").style.display = "flex"; };
window.closeModal = () => document.getElementById("editModal").style.display = "none";
window.saveBalance = async () => {
    const val = Number(document.getElementById("newBalanceField").value);
    await updateDoc(doc(db, "users", currentEditId), { globalBalance: val });
    closeModal(); alert("Balance Updated!");
};

loadView('users');