import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBl160ksq5bQ4jtuSVNuvjD2F8D-LPzPCY",
  authDomain: "kmcc-admin.firebaseapp.com",
  projectId: "kmcc-admin",
  storageBucket: "kmcc-admin.firebasestorage.app",
  messagingSenderId: "1046282440166",
  appId: "1:1046282440166:web:2759f4e264c7a75446da27",
  measurementId: "G-41V7FNNGHF"
};

// ✅ Prevent re-initialization in Next.js (VERY IMPORTANT)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);