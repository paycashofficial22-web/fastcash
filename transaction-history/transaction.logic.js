 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Firebase Config (Apni wahi purani wali yahan paste karein)
const firebaseConfig = {
  apiKey: "AIzaSyBic-MxXkb4vG_gijQlZCn7Lh8BERP1M9g",
  authDomain: "moneylogic2026-fa88f.firebaseapp.com",
  projectId: "moneylogic2026-fa88f",
  storageBucket: "moneylogic2026-fa88f.firebasestorage.app",
  messagingSenderId: "511787870430",
  appId: "1:511787870430:web:39d538fdfef74ba5cd7a4f"
};

// 2. Initialize (Fixes '[DEFAULT]' error)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentView = 'Deposit';

// 3. Elements Pakarna
const historyBody = document.getElementById('historyBody');
const btnDeposit = document.getElementById('btnDeposit');
const btnWithdraw = document.getElementById('btnWithdraw');

// 4. Tab Switching Logic (Fixes 'switchTab is not defined')
const switchTab = (type) => {
    currentView = type;
    if(type === 'Deposit') {
        btnDeposit.classList.add('active');
        btnWithdraw.classList.remove('active');
    } else {
        btnWithdraw.classList.add('active');
        btnDeposit.classList.remove('active');
    }
    if(auth.currentUser) loadTransactions(auth.currentUser.uid);
};

// Listeners lagana
btnDeposit.addEventListener('click', () => switchTab('Deposit'));
btnWithdraw.addEventListener('click', () => switchTab('Withdraw'));

// 5. Auth State Change
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadTransactions(user.uid);
    } else {
        window.location.href = "../login.html"; // Agar login nahi to bhej do
    }
});

// 6. Data Fetching Logic
function loadTransactions(uid) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const q = query(
        collection(db, "transactions"),
        where("uid", "==", uid),
        where("type", "==", currentView),
        where("timestamp", ">=", sevenDaysAgo),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        historyBody.innerHTML = "";
        document.getElementById('showingCount').innerText = `Showing ${snapshot.size} transactions`;

        if (snapshot.empty) {
            historyBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px;">No records found for last 7 days.</td></tr>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = data.timestamp?.toDate().toLocaleDateString('en-GB');
            const timeStr = data.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const initials = data.userName?.charAt(0).toUpperCase() || 'U';

            let statusHTML = '';
            if (data.status === "Success") {
                statusHTML = `<span class="status-badge status-success">Successful <i class="fas fa-check-circle"></i></span>`;
            } else if (data.status === "Failed") {
                statusHTML = `<span class="status-badge status-rejected">Rejected <i class="fas fa-times-circle"></i></span>`;
            } else {
                statusHTML = `<span class="status-badge status-pending">Pending <i class="fas fa-clock"></i></span>`;
            }

            historyBody.innerHTML += `
                <tr style="animation: fadeIn 0.4s ease;">
                    <td>
                        <div class="user-cell">
                            <div class="avatar" style="background:#dcfce7; color:#15803d;">${initials}</div>
                            <div><strong>${data.userName || 'User'}</strong><br><small>${data.phone || ''}</small></div>
                        </div>
                    </td>
                    <td><strong>Rs. ${data.amount}</strong></td>
                    <td><code>${data.trxId || data.method}</code></td>
                    <td>${dateStr}<br><small>${timeStr}</small></td>
                    <td>${statusHTML}</td>
                </tr>`;
        });
    }, (error) => {
        console.error("Error loading transactions: ", error);
    });
}