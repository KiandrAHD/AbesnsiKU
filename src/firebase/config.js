import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA-9TofebIb8HjMwHfljyN_zq_upCD85lM",
    authDomain: "absensiku-16669.firebaseapp.com",
    projectId: "absensiku-16669",
    storageBucket: "absensiku-16669.appspot.com",
    messagingSenderId: "850429661124",
    appId: "1:850429661124:web:a27afdb9a093831a2c1e91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
