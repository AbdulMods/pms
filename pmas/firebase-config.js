// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyB4OuAZI7wCvoQSqL4OHOD0OHvLG3d2Uy0",
    authDomain: "sun-rise-trading.firebaseapp.com",
    databaseURL: "https://sun-rise-trading-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sun-rise-trading",
    storageBucket: "sun-rise-trading.appspot.com",
    messagingSenderId: "645509185924",
    appId: "1:645509185924:web:7a68bf2b7496569de61dd1",
    measurementId: "G-EVDJY77DZF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { db, auth, analytics, storage }; 