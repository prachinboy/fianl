
import { recommendV3 } from './recommendV3.js';
import { fetchLogs, transformToTransactions, runApriori, suggestFromApriori } from './apriori.js';
import recipes from '../data/recipes.json' assert { type: "json" };
import axios from 'axios';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export async function recommendHybrid(userInput, liked_dishes = []) {
  const safeInput = {
    meats: userInput.meats || [],
    veggies: userInput.veggies || [],
    methods: userInput.methods || [],
    favorite: userInput.favorite || ""
  };

  // ✅ ดึง liked_dishes จาก Firestore ถ้าไม่ได้ส่งเข้ามา
  if (!liked_dishes.length) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          liked_dishes = snap.data().liked_dishes || [];
          console.log("✅ Loaded liked_dishes from Firestore:", liked_dishes);
        }
      } catch (err) {
        console.error("❌ Error fetching liked_dishes:", err);
      }
    }
  }

  // ✅ Content-Based (V3)
  const v3Results = recommendV3(safeInput);

  // ✅ Apriori
  const logs = await fetchLogs();
  const transactions = transformToTransactions(logs);
  const aprioriRules = runApriori(transactions, 0.1, 0.3);
  console.log("📊 Logs count:", logs.length);
  console.log("📊 Transactions sample:", transactions.slice(0, 5));
  console.log("📊 Apriori Rules:", aprioriRules);
  const aprioriResults = suggestFromApriori(aprioriRules, liked_dishes);
  console.log("🔥 Apriori Suggestions:", aprioriResults);

  // ✅ LSTM API (ป้องกันการส่งข้อมูลว่าง)
  let lstmResults = [];
  try {
    if (liked_dishes && liked_dishes.length > 0) {
      console.log("✅ Sending to LSTM API:", { liked_dishes });
      const res = await axios.post('http://127.0.0.1:5000/recommend-lstm', {
        liked_dishes: liked_dishes
      });
      lstmResults = res.data.recommendations || [];
    } else {
      console.warn("⚠️ No liked_dishes to send to LSTM");
    }
  } catch (error) {
    console.error('❌ LSTM API error:', error);
  }

  const allResults = {};
  function addOrUpdate(dish, score, source) {
    if (!allResults[dish]) {
      allResults[dish] = { score: 0, source: [] };
    }
    allResults[dish].score += score;
    if (!allResults[dish].source.includes(source)) {
      allResults[dish].source.push(source);
    }
  }

  const synonyms = {
    "ไก่": ["ไก่", "อกไก่", "เนื้อไก่", "chicken"],
    "หมู": ["หมู", "เนื้อหมู", "pork"],
    "เนื้อ": ["เนื้อ", "beef", "เนื้อวัว"],
    "กุ้ง": ["กุ้ง", "shrimp"],
    "ปลา": ["ปลา", "fish"],
    "เป็ด": ["เป็ด", "duck"]
  };

  function isRelevant(dishName) {
    const recipe = recipes.find(r => r.name === dishName);
    if (!recipe) return false;

    const { meats, veggies, methods, favorite } = safeInput;
    const ing = (recipe.ingredients || []).map(i => i.toLowerCase());
    const methodText = (recipe.method || "").toLowerCase();
    const nameLower = recipe.name.toLowerCase();

    const meatOk = !meats.length || meats.some(m => {
      const group = synonyms[m] || [m];
      return group.some(syn =>
        ing.some(i => i.includes(syn.toLowerCase())) || nameLower.includes(syn.toLowerCase())
      );
    });

    const vegOk = !veggies.length || veggies.some(v =>
      ing.some(i => i.includes(v.toLowerCase())) || nameLower.includes(v.toLowerCase())
    );
    const methodOk = !methods.length || methods.some(m => methodText.includes(m.toLowerCase()));
    const favOk = !favorite || nameLower.includes(favorite.toLowerCase());

    return meatOk && vegOk && methodOk && favOk;
  }

  v3Results.forEach(r => addOrUpdate(r.name, r.score * 1.5, 'v3'));
  aprioriResults.forEach(d => addOrUpdate(d, 2.5, 'apriori'));
  lstmResults.filter(d => isRelevant(d)).forEach(d => addOrUpdate(d, 2, 'lstm'));

  return Object.entries(allResults)
    .map(([name, { score, source }]) => ({ name, score, source }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}
