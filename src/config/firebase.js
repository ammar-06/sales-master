// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYh-3At6q9nmvD3LLvFABalwF9NosTAsc",
  authDomain: "ammar-hub.firebaseapp.com",
  projectId: "ammar-hub",
  storageBucket: "ammar-hub.firebasestorage.app",
  messagingSenderId: "414558735096",
  appId: "1:414558735096:web:4fae978a5253017613090d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = "ammar-shop-1";
export const ADMIN_ACCESS_CODE = "78601";