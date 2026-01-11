import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyD7v2h2XKMWcBWStDdMCO1QAjncXETUZc0",
  authDomain: "dss-val.firebaseapp.com",
  projectId: "dss-val",
  storageBucket: "dss-val.firebasestorage.app",
  messagingSenderId: "832429574824",
  appId: "1:832429574824:web:ec261dea50a938e547d09d",
  measurementId: "G-TQKDZ3BS6B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
