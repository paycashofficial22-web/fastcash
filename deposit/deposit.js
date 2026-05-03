 /* DEPOSIT LOGIC */
import { auth, db } from "../firebase-config.js"; 
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let selectedMethod = "";

// 1. Select Method Logic
window.selectMethod = (method) => {
    selectedMethod = method;
    document.getElementById('epCard').className = "method-box " + (method === 'easypaisa' ? 'active-ep' : '');
    document.getElementById('jcCard').className = "method-box " + (method === 'jazzcash' ? 'active-jc' : '');
};

// 2. Start Search & Timer
window.startSearch = () => {
    const amount = document.getElementById('userAmount').value;

    // VALIDATION: Agar method select nahi kiya to ALERT
    if (!selectedMethod) {
        alert("Pehle Easypaisa ya JazzCash account select karein!");
        return;
    }
    if (!amount || amount < 100) {
        alert("Meharbani karke deposit amount likhein (Min 100 PKR)!");
        return;
    }

    document.getElementById('searchBtn').style.display = 'none';
    document.getElementById('timerContainer').style.display = 'block';

    let seconds = 10;
    const interval = setInterval(() => {
        seconds--;
        document.getElementById('timerText').innerText = `Searching for active account... ${seconds}s`;

        if (seconds <= 0) {
            clearInterval(interval);
            document.getElementById('timerContainer').style.display = 'none';
            showAccountInfo();
        }
    }, 1000);
};

// 3. Show Account Info
function showAccountInfo() {
    const numBox = document.getElementById('accNumber');
    const nameBox = document.getElementById('accName');

    if (selectedMethod === 'easypaisa') {
        numBox.innerText = "03450000000"; // Admin EP Number
        nameBox.innerText = "Admin EP Name";
    } else {
        numBox.innerText = "03010000000"; // Admin JC Number
        nameBox.innerText = "Admin JC Name";
    }
    document.getElementById('accountDisplay').style.display = 'block';
}

// 4. Submit to Firebase
window.sendToFirebase = async () => {
    const tid = document.getElementById('tidInput').value;
    const amount = document.getElementById('userAmount').value;

    if (tid.length < 10) {
        alert("Transaction ID sahi se enter karein!");
        return;
    }

    try {
        await addDoc(collection(db, "depositRequests"), {
            uid: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            method: selectedMethod,
            amount: parseInt(amount),
            transactionID: tid,
            status: "pending",
            timestamp: serverTimestamp()
        });

 // Firebase me data save hone ke baad ye alert aayega
        alert("Apki request bhj di gi ha please intezar kijyaga. Admin verify kar raha ha");

        // --- Window Close & Redirect Logic ---
        try {
            // Check karega agar dashboard ka function maujood hai
            if (window.parent && window.parent !== window && typeof window.parent.closeDeposit === "function") {
                window.parent.closeDeposit();
            } else {
                // Agar function nahi hai to direct dashboard par bhej dega
                window.location.replace("../dashboard/dashboard.html");
            }
        } catch (e) {
            // Kisi bhi error ki surat mein page redirect kar dega
            window.location.replace("../dashboard/dashboard.html");
        }

    } catch (error) {
        // Ye main catch block hai jo firebase errors handle karta hai
        console.error("Firebase Error:", error);
        alert("Error: " + error.message);
    }
};


window.copyText = () => {
    const num = document.getElementById('accNumber').innerText;
    navigator.clipboard.writeText(num);
    alert("Number copied!");
};