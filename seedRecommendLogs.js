import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwnBrolcf9Pjax16jQORTxCaBTKY1gEVk",
  authDomain: "recipe-recommender-65da8.firebaseapp.com",
  projectId: "recipe-recommender-65da8",
  storageBucket: "recipe-recommender-65da8.firebasestorage.app",
  messagingSenderId: "251998237785",
  appId: "1:251998237785:web:02dcfb6569fdf6c0302d48"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleDishes = [
  ["ข้าวผัดหมู", "ลาบหมู", "ผัดกะเพราไก่"],
  ["ต้มยำกุ้ง", "แกงเขียวหวานไก่", "ข้าวมันไก่"],
  ["ผัดไทยกุ้งสด", "ข้าวผัดปู"],
  ["หมูทอดกระเทียม", "ผัดพริกแกงหมู"],
  ["ก๋วยเตี๋ยวเรือ", "ข้าวผัดหมู", "ลาบหมู"],
  ["แกงป่าไก่", "ข้าวผัดกุ้ง"],
  ["ลาบหมู", "หมูมะนาว"],
  ["ผัดคะน้าหมูกรอบ", "ข้าวผัดไข่"],
  ["ข้าวมันไก่", "ไก่ทอดกระเทียม"],
  ["ต้มข่าไก่", "ต้มยำกุ้ง"]
];

async function seedLogs() {
  try {
    for (let i = 0; i < sampleDishes.length; i++) {
      await addDoc(collection(db, "recommend_logs"), {
        userId: `mock_user_${i}`,
        liked_dishes: sampleDishes[i],
        timestamp: serverTimestamp()
      });
      console.log(`✅ เพิ่ม log ที่ ${i + 1}:`, sampleDishes[i]);
    }
    console.log("🎉 เพิ่มข้อมูล recommend_logs เสร็จแล้ว!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding logs:", error);
    process.exit(1);
  }
}

seedLogs();
