import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, updateDoc, deleteDoc, query, where, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 1. DYNAMIC STATS UPDATER
onSnapshot(collection(db, "users"), s => {
    if(document.getElementById("countUsers")) document.getElementById("countUsers").innerText = s.size;
});

onSnapshot(collection(db, "depositRequests"), s => {
    if(document.getElementById("countDeposits")) document.getElementById("countDeposits").innerText = s.size;
});

onSnapshot(collection(db, "withdrawRequests"), s => {
    if(document.getElementById("countWithdraws")) document.getElementById("countWithdraws").innerText = s.size;
});

// 2. MAIN VIEW LOADER
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
                        <button class="btn-action btn-approve" onclick="approveDeposit('${d.id}', '${r.uid}', ${r.amount})">Approve</button>
                        <button class="btn-action btn-delete" onclick="deleteEntry('depositRequests', '${d.id}')">Reject</button>
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
            if (snap.empty) {
                tBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No pending withdraws.</td></tr>";
            }
            snap.forEach(d => {
                const w = d.data();
                tBody.innerHTML += `<tr class="data-row">
                    <td><b>${w.userName || 'No Name'}</b><br><small>${w.uid || ''}</small></td>
                    <td><b style="color:red;">Rs. ${w.amount || 0}</b></td>
                    <td>${w.method || 'N/A'}</td>
                    <td><code class="searchable">${w.accountNumber || 'No No.'}</code></td>
                    <td>
                        <button class="btn-action btn-approve" onclick="approveWithdraw('${d.id}')">Done</button>
                        <button class="btn-action btn-delete" onclick="rejectWithdraw('${d.id}', '${w.uid}', ${w.amount})">Reject & Refund</button>
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
                    <td>
                        <button class="btn-action btn-edit" onclick="openEditModal('${d.id}', ${u.globalBalance || 0})">Edit</button>
                    </td>
                </tr>`;
            });
        });
    }
};

// 3. WITHDRAW LOGIC (Approve & Reject with Refund)
window.approveWithdraw = async (docId) => {
    if(confirm("Confirm: Kya aapne user ko paise bhej diye hain?")) {
        try {
            await deleteDoc(doc(db, "withdrawRequests", docId));
            alert("Withdrawal marked as completed!");
        } catch (e) { console.error(e); }
    }
};

window.rejectWithdraw = async (docId, userUid, amount) => {
    if(confirm("Kya aap is request ko reject karke balance refund karna chahte hain?")) {
        try {
            const userRef = doc(db, "users", userUid);
            await updateDoc(userRef, { globalBalance: increment(Number(amount)) });
            await deleteDoc(doc(db, "withdrawRequests", docId));
            alert("Request rejected aur balance refund kar diya gaya!");
        } catch (e) { console.error(e); }
    }
};

// 4. DEPOSIT APPROVAL
window.approveDeposit = async (docId, userUid, amount) => {
    try {
        const numAmount = Number(amount);
        const uQuery = query(collection(db, "users"), where("uid", "==", userUid));
        const userSnap = await getDocs(uQuery);

        if (!userSnap.empty) {
            const userRef = userSnap.docs[0].ref;
            const userData = userSnap.docs[0].data();

            if (userData.isPaid === false) {
                await updateDoc(userRef, { globalBalance: increment(numAmount), isPaid: true });
                if (userData.referredBy && userData.referredBy !== "none") {
                    const rQuery = query(collection(db, "users"), where("uid", "==", userData.referredBy));
                    const refSnap = await getDocs(rQuery);
                    if (!refSnap.empty) {
                        await updateDoc(refSnap.docs[0].ref, { referralBalance: increment(40), paidReferralCount: increment(1) });
                    }
                }
            } else {
                await updateDoc(userRef, { globalBalance: increment(numAmount) });
            }
            await deleteDoc(doc(db, "depositRequests", docId));
            alert("Deposit Approved successfully!");
        }
    } catch (e) { console.error(e); }
};

// 5. UTILITY & MODAL FUNCTIONS
window.deleteEntry = async (c, id) => { 
    if(confirm("Are you sure you want to delete this?")) {
        await deleteDoc(doc(db, c, id)); 
    }
};

window.openEditModal = (id, current) => {
    currentEditId = id;
    if(document.getElementById("newBalanceField")) document.getElementById("newBalanceField").value = current;
    if(document.getElementById("editModal")) document.getElementById("editModal").style.display = "flex";
};

window.closeModal = () => {
    if(document.getElementById("editModal")) document.getElementById("editModal").style.display = "none";
};

// Edit Balance Save Logic
window.saveBalance = async () => {
    const field = document.getElementById("newBalanceField");
    if(currentEditId && field) {
        const newVal = Number(field.value);
        await updateDoc(doc(db, "users", currentEditId), { globalBalance: newVal });
        closeModal();
        alert("Balance Updated!");
    }
};

loadView('users');



