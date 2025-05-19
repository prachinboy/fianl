// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwnBrolcf9Pjax16jQORTxCaBTKY1gEVk",
  authDomain: "recipe-recommender-65da8.firebaseapp.com",
  projectId: "recipe-recommender-65da8",
  storageBucket: "recipe-recommender-65da8.firebasestorage.app",
  messagingSenderId: "251998237785",
  appId: "1:251998237785:web:02dcfb6569fdf6c0302d48"
};

// เริ่มใช้งาน Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
