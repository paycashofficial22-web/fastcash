 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // updateDoc aur doc add kiya
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);

const notifList = document.getElementById("notificationList");

onAuthStateChanged(auth, (user) => {
    if (user) {
        const currentUserUID = user.uid;
        loadNotifications(currentUserUID);
    } else {
        if (notifList) notifList.innerHTML = '<div class="no-msg">Please login to see messages.</div>';
    }
});

function loadNotifications(uid) {
    const q = query(
        collection(db, "notifications"), 
        where("target", "in", ["all", uid]), 
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        if (notifList) notifList.innerHTML = ""; 

        if (snapshot.empty) {
            notifList.innerHTML = '<div class="no-msg">No messages for you! 🔔</div>';
            return;
        }

        snapshot.forEach(async (messageDoc) => {
            const data = messageDoc.data();
            const docId = messageDoc.id; // Message ki unique ID
            
            // UI Render
            const card = document.createElement("div");
            card.className = "msg-card";
            card.innerHTML = `
                <div style="background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid ${data.status === 'unread' ? '#3b82f6' : 'transparent'};">
                    <p style="color: white; margin: 0;">${data.message}</p>
                    <small style="color: #94a3b8;">${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Just now'}</small>
                </div>
            `;
            notifList.appendChild(card);

            // --- AUTO READ LOGIC ---
            // Sirf wahi message "read" hoga jo specifically isi user (UID) ke liye hai
            if (data.status === "unread" && data.target === uid) {
                try {
                    const docRef = doc(db, "notifications", docId);
                    await updateDoc(docRef, { status: "read" });
                    console.log("Status updated to read for:", docId);
                } catch (err) {
                    console.error("Update error:", err);
                }
            }
        });
    });
}