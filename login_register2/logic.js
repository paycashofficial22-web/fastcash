 // URL se ID pakar kar box mein khud likh dena
const urlParams = new URLSearchParams(window.location.search);
const refFromURL = urlParams.get('ref'); 

if (refFromURL) {
    const refInput = document.getElementById("refCode");
    if (refInput) {
        refInput.value = refFromURL;
        refInput.readOnly = true; // User isay chhair na sakay
        refInput.style.backgroundColor = "#e0e0e0"; // Thora grey rang taake pata chale locked hai
    }
}
 
 
 
 
 // Pehle Firebase config se 'db' ko import karein
import { db } from '../firebase-config.js'; 
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Registration Logic
const regForm = document.getElementById('registerForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const pass = document.getElementById('regPass').value;

        try {
            // --- Is naye block se purana wala replace karein ---
await setDoc(doc(db, "users", phone), {
    fullName: name,
    phoneNumber: phone,
    password: pass,
    globalBalance: 0,
    isLocked: false,
    lockedAt: null,
    
    // Naye Zarori Fields:
    uid: Math.floor(1000 + Math.random() * 9000).toString(), // Is user ki apni ID
    referredBy: document.getElementById("refCode").value || refFromURL || null, // Pichle bande ki ID
    paidReferralCount: 0,
    withdrawUnlocked: false,
    isPaid: false
});
            alert("Mobarak hu! AP ka account Firebase par bn gyaa ha.");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Firebase Error:", error);
            alert("Account banane mein masla hua: " + error.message);
        }
    });
}

// Login Logic
const logForm = document.getElementById('loginForm');
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('loginPhone').value;
        const pass = document.getElementById('loginPass').value;

        // Firebase se user ka data check karna
        const userDoc = await getDoc(doc(db, "users", phone));

        if (userDoc.exists() && userDoc.data().password === pass) {
            // Phone number ko local storage mein sirf session handle karne ke liye rakhen
            localStorage.setItem("userPhone", phone);
            window.location.href = "../dashboard/dashboard.html";
        } else {
            alert("Ghalat phone number ya password!");
        }
    });
}

