 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Firebase Config (Same as your admin-logic.js)
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

// 2. Global Notification Fetching
onSnapshot(doc(db, "settings", "announcements"), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // UI par message dikhana
        document.getElementById('announcementText').innerText = data.currentMsg;
        
        // Time dikhana (agar timestamp bheja hai)
        if(data.timestamp) {
            const date = data.timestamp.toDate();
            document.getElementById('msgTime').innerText = "Posted on: " + date.toLocaleString();
        }

        // 3. Mark as Read (Dot khatam karne ke liye ID save karein)
        localStorage.setItem("lastSeenMsgId", data.msgId);
    } else {
        document.getElementById('announcementText').innerText = "No announcements at this time.";
    }
});

// 4. Personal Message (Optionally fetch if needed)
const userPhone = localStorage.getItem("userPhone");
if(userPhone) {
    onSnapshot(doc(db, "users", userPhone), (docSnap) => {
        if(docSnap.exists() && docSnap.data().personalMsg) {
            document.getElementById('personalMsgArea').innerHTML = `
                <div class="msg-card" style="border-left: 5px solid #e11d48;">
                    <p style="color: #1e293b; font-weight: 500;">${docSnap.data().personalMsg}</p>
                </div>
            `;
        }
    });
}