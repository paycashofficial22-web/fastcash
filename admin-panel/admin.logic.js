 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, updateDoc, deleteDoc, query, where, getDocs, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- LIVE DATABASE CONNECTION ---
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

// 1. DYNAMIC STATS UPDATER (With NaN Protection)
onSnapshot(collection(db, "users"), s => {
    if(document.getElementById("countUsers")) document.getElementById("countUsers").innerText = s.size;
    let totalFunds = 0;
    let totalBonuses = 0;
    s.forEach(d => {
        const data = d.data();
        totalFunds += Number(data.globalBalance || 0);
        totalBonuses += Number(data.referralBalance || 0);
    });
    if(document.getElementById("statFunds")) document.getElementById("statFunds").innerText = "Rs. " + totalFunds.toLocaleString();
    if(document.getElementById("statBonuses")) document.getElementById("statBonuses").innerText = "Rs. " + totalBonuses.toLocaleString();
});

// Stats for Deposit Requests
onSnapshot(collection(db, "depositRequests"), s => {
    if(document.getElementById("countDeposits")) document.getElementById("countDeposits").innerText = s.size;
});

// 2. MAIN VIEW LOADER
window.loadView = (view) => {
    const tHead = document.getElementById("tHead");
    const tBody = document.getElementById("tBody");
    const title = document.getElementById("viewTitle");

    if (view === 'deposits') {
        title.innerText = "Deposit Approval Queue";
        tHead.innerHTML = `<tr><th>User UID</th><th>Amt</th><th>Method</th><th>TRX ID</th><th>Actions</th></tr>`;
        
        onSnapshot(collection(db, "depositRequests"), (snap) => {
            tBody.innerHTML = "";
            if (snap.empty) {
                tBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No pending requests.</td></tr>";
            }
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
    } else {
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

// 3. REFERRAL & APPROVAL LOGIC (Fixed to handle Strings and Numbers)
window.approveDeposit = async (docId, userUid, amount) => {
    try {
        const numAmount = Number(amount);
        const uQuery = query(collection(db, "users"), where("uid", "==", userUid));
        const userSnap = await getDocs(uQuery);

        if (!userSnap.empty) {
            const userRef = userSnap.docs[0].ref;
            const userData = userSnap.docs[0].data();

            // First time payment activation logic
            if (userData.isPaid === false) {
                await updateDoc(userRef, { 
                    globalBalance: increment(numAmount), 
                    isPaid: true 
                });
                
                // Referral Bonus
                if (userData.referredBy && userData.referredBy !== "none") {
                    const rQuery = query(collection(db, "users"), where("uid", "==", userData.referredBy));
                    const refSnap = await getDocs(rQuery);
                    if (!refSnap.empty) {
                        await updateDoc(refSnap.docs[0].ref, {
                            referralBalance: increment(40),
                            paidReferralCount: increment(1)
                        });
                    }
                }
            } else {
                // Regular deposit for already paid users
                await updateDoc(userRef, { globalBalance: increment(numAmount) });
            }
            
            // Delete request from depositRequests collection
            await deleteDoc(doc(db, "depositRequests", docId));
            alert("Deposit Approved successfully!");
        } else {
            alert("Error: User UID not found in 'users' collection!");
        }
    } catch (e) { 
        console.error("Approval Error:", e);
        alert("Error: Check console for details.");
    }
};

// 4. UTILITY FUNCTIONS
window.deleteEntry = async (c, id) => { 
    if(confirm("Are you sure you want to delete this?")) {
        await deleteDoc(doc(db, c, id)); 
    }
};

window.filterData = () => {
    let input = document.getElementById('adminSearch').value.toLowerCase();
    document.querySelectorAll('.data-row').forEach(row => {
        let matched = false;
        row.querySelectorAll('.searchable').forEach(cell => {
            if (cell.innerText.toLowerCase().includes(input)) matched = true;
        });
        row.style.display = matched ? "" : "none";
    });
};

window.openEditModal = (id, current) => {
    currentEditId = id;
    document.getElementById("newBalanceField").value = current;
    document.getElementById("editModal").style.display = "flex";
};

window.closeModal = () => document.getElementById("editModal").style.display = "none";

const saveBtn = document.getElementById("saveBalanceBtn");
if(saveBtn) {
    saveBtn.onclick = async () => {
        const val = Number(document.getElementById("newBalanceField").value);
        if(currentEditId) {
            await updateDoc(doc(db, "users", currentEditId), { globalBalance: val });
            closeModal();
            alert("Balance Updated!");
        }
    };
}

// Initial View
loadView('users');