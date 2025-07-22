import { recommendV3 } from './recommendV3.js';
import { fetchLogs, transformToTransactions, runApriori, suggestFromApriori } from './apriori.js';
import axios from 'axios';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const synonyms = {
  "ไก่": ["ไก่", "อกไก่", "น่องไก่", "chicken"],
  "หมู": ["หมู", "เนื้อหมู", "pork"],
  "เนื้อ": ["เนื้อ", "เนื้อวัว", "beef"],
  "กุ้ง": ["กุ้ง", "shrimp"],
  "ปลา": ["ปลา", "fish"],
  "เป็ด": ["เป็ด", "duck"]
};

// ✅ ดึง recipes จาก Firestore
async function fetchRecipesFromFirestore() {
  const snapshot = await getDocs(collection(db, "recipes"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ✅ ฟังก์ชันกรองแบบ AND Logic
function filterRecipesByInput(userInput, recipes) {
  return recipes.filter(recipe => {
    const ing = (recipe.ingredients || []).map(i => i.toLowerCase());
    const methodText = (recipe.method || "").toLowerCase();
    const nameLower = recipe.name.toLowerCase();

    const meatOk =
      !userInput.meats?.length ||
      userInput.meats.every(m => {
        const group = synonyms[m] || [m];
        return group.some(syn =>
          ing.some(i => i.includes(syn.toLowerCase())) ||
          nameLower.includes(syn.toLowerCase())
        );
      });

    const vegOk =
      !userInput.veggies?.length ||
      userInput.veggies.every(v =>
        ing.some(i => i.includes(v.toLowerCase())) ||
        nameLower.includes(v.toLowerCase())
      );

    const methodOk =
      !userInput.types?.length ||
      userInput.types.every(t =>
        methodText.includes(t.toLowerCase()) ||
        recipe.type?.toLowerCase().includes(t.toLowerCase())
      );

    const favOk =
      !userInput.favorite ||
      nameLower.includes(userInput.favorite.toLowerCase());

    return meatOk && vegOk && methodOk && favOk;
  });
}

export async function recommendHybrid(userInput, liked_dishes = []) {
  const safeInput = {
    meats: userInput.meats || [],
    veggies: userInput.veggies || [],
    types: userInput.types || [],
    favorite: userInput.favorite || ""
  };

  // ✅ โหลด liked_dishes ถ้าไม่ได้ส่งเข้ามา
  if (!liked_dishes.length) {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          liked_dishes = snap.data().liked_dishes || [];
        }
      } catch (err) {
        console.error("❌ Error fetching liked_dishes:", err);
      }
    }
  }

  const allRecipes = await fetchRecipesFromFirestore();
  const isNoFilter =
    !safeInput.meats.length &&
    !safeInput.veggies.length &&
    !safeInput.types.length &&
    !safeInput.favorite;

  const filteredRecipes = isNoFilter
    ? allRecipes
    : filterRecipesByInput(safeInput, allRecipes);

  console.log("✅ Filtered Recipes:", filteredRecipes.map(r => r.name));

  // ✅ Content-Based (V3)
  const v3Results = recommendV3(safeInput)
    .filter(r => filteredRecipes.some(f => f.name === r.name));

  // ✅ เมนูโปรด (เพิ่มเฉพาะถ้าตรงกับ Filter จริง)
  if (safeInput.favorite) {
    const strictFav = filterRecipesByInput(safeInput, allRecipes).find(r =>
      r.name.includes(safeInput.favorite)
    );
    if (strictFav) {
      v3Results.push({ name: strictFav.name, score: 20 });
    }
  }

  // ✅ Apriori (กรองด้วย Filter)
  const logs = await fetchLogs();
  const transactions = transformToTransactions(logs);
  const aprioriRules = runApriori(transactions, 0.1, 0.3);
  const aprioriResults = suggestFromApriori(aprioriRules, liked_dishes)
    .filter(d => filteredRecipes.some(f => f.name === d));

  // ✅ LSTM (กรองด้วย Filter)
  let lstmResults = [];
  try {
    if (liked_dishes.length > 0) {
      const res = await axios.post('http://127.0.0.1:5000/recommend-lstm', {
        liked_dishes: liked_dishes
      });
      lstmResults = (res.data.recommendations || [])
        .filter(d => isNoFilter || filteredRecipes.some(f => f.name === d));
    }
  } catch (error) {
    console.error('❌ LSTM API error:', error);
  }

  // ✅ รวมคะแนน Hybrid
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

  v3Results.forEach(r => addOrUpdate(r.name, r.score * 1.5, 'v3'));
  aprioriResults.forEach(d => addOrUpdate(d, 2.5, 'apriori'));

  lstmResults.forEach(d => {
    const bonus = liked_dishes.includes(d) ? 5 : 2;
    addOrUpdate(d, bonus, 'lstm');
  });

  let finalResults = Object.entries(allResults)
    .map(([name, { score, source }]) => ({ name, score, source }))
    .sort((a, b) => b.score - a.score);

  // ✅ เติมเมนู Extra ให้ครบ 7 เมนูถ้าผลลัพธ์ไม่พอ
  if (finalResults.length < 7) {
    const existingNames = finalResults.map(r => r.name);
    const additional = allRecipes
      .filter(r => !existingNames.includes(r.name))
      .slice(0, 7 - finalResults.length)
      .map(r => ({
        name: r.name,
        score: 0.5,
        source: ["extra"]
      }));
    finalResults = [...finalResults, ...additional];
  }

  return finalResults.slice(0, 7);
}
