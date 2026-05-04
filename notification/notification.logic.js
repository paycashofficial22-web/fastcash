 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Logic: Aaj se 7 din pehle ka time nikalna
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const timeLimit = Timestamp.fromDate(sevenDaysAgo);

// --- 1. Global Notifications (Collection Fetching) ---
const globalRef = collection(db, "announcements");
const qGlobal = query(globalRef, where("timestamp", ">=", timeLimit), orderBy("timestamp", "desc"));

onSnapshot(qGlobal, (snapshot) => {
    const globalContainer = document.getElementById('globalList');
    globalContainer.innerHTML = ""; 

    if (snapshot.empty) {
        globalContainer.innerHTML = "<p class='no-msg'>Pichle 7 din mein koi naya update nahi aaya.</p>";
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Just now";
        
        globalContainer.innerHTML += `
            <div class="msg-card system-card">
                <i class="fas fa-bullhorn icon-bg"></i>
                <p style="margin:0; font-weight:500;">${data.message}</p>
                <span class="time-stamp">${dateStr}</span>
            </div>
        `;
    });
}, (error) => {
    console.error("Global Msg Error:", error);
    // Agar Indexing ka error aaye to console mein link par click lazmi karein
});

// --- 2. Personal Messages (User Specific Collection) ---
const userPhone = localStorage.getItem("userPhone"); 

if (userPhone) {
    // Har user ke liye uske phone number ke andar "messages" collection se data uthana
    const personalRef = collection(db, "users", userPhone, "messages");
    const qPersonal = query(personalRef, where("timestamp", ">=", timeLimit), orderBy("timestamp", "desc"));

    onSnapshot(qPersonal, (snapshot) => {
        const personalContainer = document.getElementById('personalList');
        personalContainer.innerHTML = "";

        if (snapshot.empty) {
            personalContainer.innerHTML = "<p class='no-msg'>Aap ke liye koi private message nahi hai.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : "Recent";

            personalContainer.innerHTML += `
                <div class="msg-card" style="border-left: 4px solid #00ff88; background: rgba(0, 255, 136, 0.05); padding: 15px; border-radius: 8px;">
                    <p style="color: #fff; margin:0;">${data.message}</p>
                    <span class="time-stamp" style="color: #00ff88;">${dateStr}</span>
                </div>
            `;
        });
    });
} else {
    document.getElementById('personalList').innerHTML = "<p class='no-msg'>Please login to see private messages.</p>";
}