import { recommendV3 } from './recommendV3.js';
import { fetchLogs, transformToTransactions, runApriori, suggestFromApriori } from './apriori.js';
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

// ✅ ดึง recipes จาก Firestore + กัน null ทุก field
async function fetchRecipesFromFirestore() {
  const snapshot = await getDocs(collection(db, "recipes"));
  return snapshot.docs
    .map(doc => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || "", // ป้องกันไม่มีชื่อ
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        method: data.method || "",
        type: data.type || ""
      };
    })
    .filter(r => r.name); // ต้องมีชื่อเท่านั้น
}

// ✅ ฟังก์ชันกรองแบบ AND Logic (กัน undefined ทุกกรณี)
function filterRecipesByInput(userInput, recipes) {
  const safeInput = {
    meats: Array.isArray(userInput.meats) ? userInput.meats : [],
    veggies: Array.isArray(userInput.veggies) ? userInput.veggies : [],
    types: Array.isArray(userInput.types) ? userInput.types : [],
    favorite: userInput.favorite || ""
  };

  return recipes
    .filter(recipe => recipe && recipe.name)
    .filter(recipe => {
      const ing = Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map(i => (i || "").toLowerCase())
        : [];
      const methodText = (recipe.method || "").toLowerCase();
      const nameLower = (recipe.name || "").toLowerCase();

      const meatOk =
        !safeInput.meats.length ||
        safeInput.meats.every(m => {
          const group = synonyms[m] || [m];
          return group.some(syn =>
            ing.some(i => i.includes(syn.toLowerCase())) ||
            nameLower.includes(syn.toLowerCase())
          );
        });

      const vegOk =
        !safeInput.veggies.length ||
        safeInput.veggies.every(v =>
          ing.some(i => i.includes(v.toLowerCase())) ||
          nameLower.includes(v.toLowerCase())
        );

      const methodOk =
        !safeInput.types.length ||
        safeInput.types.every(t =>
          methodText.includes(t.toLowerCase()) ||
          (recipe.type || "").toLowerCase().includes(t.toLowerCase())
        );

      const favOk =
        !safeInput.favorite ||
        nameLower.includes(safeInput.favorite.toLowerCase());

      return meatOk && vegOk && methodOk && favOk;
    });
}

export async function recommendHybrid(userInput, liked_dishes = []) {
  // ✅ ป้องกัน undefined ทุกจุด
  const safeInput = {
    meats: Array.isArray(userInput.meats) ? userInput.meats : [],
    veggies: Array.isArray(userInput.veggies) ? userInput.veggies : [],
    types: Array.isArray(userInput.types) ? userInput.types : [],
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

  // ✅ Content-Based (V3) → กัน undefined
  const v3Results = (recommendV3(safeInput) || [])
    .filter(r => r && r.name && filteredRecipes.some(f => f.name === r.name));

  // ✅ เมนูโปรด
  if (safeInput.favorite) {
    const strictFav = filterRecipesByInput(safeInput, allRecipes).find(r =>
      (r.name || "").includes(safeInput.favorite)
    );
    if (strictFav) {
      v3Results.push({ name: strictFav.name, score: 20 });
    }
  }

  // ✅ Apriori
  let aprioriResults = [];
  try {
    const logs = await fetchLogs();
    const transactions = transformToTransactions(logs);
    aprioriResults = (suggestFromApriori(
      liked_dishes,
      runApriori(transactions, 0.1, 0.3)
    ) || []).filter(d => filteredRecipes.some(f => f.name === d));
  } catch (err) {
    console.error("❌ Apriori Error:", err);
  }

  // ✅ รวมคะแนน Hybrid (ไม่มี LSTM)
  const allResults = {};
  function addOrUpdate(dish, score, source) {
    if (!dish) return;
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

  let finalResults = Object.entries(allResults)
    .map(([name, { score, source }]) => ({ name, score, source }))
    .sort((a, b) => b.score - a.score);

  // ✅ เติมเมนู Extra ให้ครบ 7 เมนูถ้าผลลัพธ์ไม่พอ
  if (finalResults.length < 7) {
    const existingNames = finalResults.map(r => r.name);
    const additional = allRecipes
      .filter(r => r && r.name && !existingNames.includes(r.name))
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
