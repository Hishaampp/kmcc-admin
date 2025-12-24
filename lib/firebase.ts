import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBl160ksq5bQ4jtuSVNuvjD2F8D-LPzPCY",
  authDomain: "kmcc-admin.firebaseapp.com",
  projectId: "kmcc-admin",
  storageBucket: "kmcc-admin.firebasestorage.app",
  messagingSenderId: "1046282440166",
  appId: "1:1046282440166:web:2759f4e264c7a75446da27",
  measurementId: "G-41V7FNNGHF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

