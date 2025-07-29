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

// ✅ ดึง recipes จาก Firestore
export async function fetchRecipesFromFirestore() {
  const snapshot = await getDocs(collection(db, "recipes"));
  return snapshot.docs
    .map(doc => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: data.name || "",
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        method: data.method || "",
        type: data.type || ""
      };
    })
    .filter(r => r.name);
}

// ✅ ฟังก์ชันกรองแบบเข้มงวด
export function filterRecipesByInput(userInput, recipes) {
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

      const hasSelectedMeat =
        !safeInput.meats.length ||
        safeInput.meats.some(m =>
          (synonyms[m] || [m]).some(syn =>
            ing.some(i => i.includes(syn.toLowerCase())) ||
            nameLower.includes(syn.toLowerCase())
          )
        );

      const noOtherMeat =
        !safeInput.meats.length ||
        !ing.some(i =>
          Object.keys(synonyms)
            .filter(key => !safeInput.meats.includes(key))
            .some(other =>
              (synonyms[other] || [other]).some(syn => i.includes(syn.toLowerCase()))
            )
        );

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

      return hasSelectedMeat && noOtherMeat && vegOk && methodOk && favOk;
    });
}

// ✅ ฟังก์ชันแนะนำเมนู Hybrid (เพิ่ม Fallback)
export async function recommendHybrid(userInput, liked_dishes = []) {
  const safeInput = {
    meats: Array.isArray(userInput.meats) ? userInput.meats : [],
    veggies: Array.isArray(userInput.veggies) ? userInput.veggies : [],
    types: Array.isArray(userInput.types) ? userInput.types : [],
    favorite: userInput.favorite || ""
  };

  // ✅ ดึง liked_dishes จาก Firestore ถ้าไม่ส่งมา
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
  const strictFiltered = filterRecipesByInput(safeInput, allRecipes);

  console.log("✅ Filtered Recipes:", strictFiltered.map(r => r.name));

  // ✅ Content-Based
  let v3Results = (recommendV3(safeInput) || [])
    .filter(r => r && r.name && strictFiltered.some(f => f.name === r.name));

  // ✅ Favorite
  if (safeInput.favorite) {
    const strictFav = strictFiltered.find(r =>
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
    const transactions = transformToTransactions(logs) || [];
    const rules = await runApriori(transactions, 0.1, 0.3) || [];
    aprioriResults = (suggestFromApriori(liked_dishes, rules) || [])
      .filter(d => strictFiltered.some(f => f.name === d));
  } catch (err) {
    console.error("❌ Apriori Error:", err);
  }

  // ✅ รวมผลลัพธ์
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

  // ✅ Fallback 1: เพิ่มเมนูจาก strictFiltered
  if (finalResults.length < 7) {
    const existingNames = finalResults.map(r => r.name);
    const additional = strictFiltered
      .filter(r => r && r.name && !existingNames.includes(r.name))
      .slice(0, 7 - finalResults.length)
      .map(r => ({
        name: r.name,
        score: 0.5,
        source: ["extra"]
      }));
    finalResults = [...finalResults, ...additional];
  }

  // ✅ Fallback 2: ถ้ายังไม่มีเลย → Random จาก allRecipes
  if (finalResults.length === 0) {
    console.warn("⚠️ No strict match → fallback random menus");
    finalResults = allRecipes
      .sort(() => Math.random() - 0.5)
      .slice(0, 7)
      .map(r => ({
        name: r.name,
        score: 0.1,
        source: ["fallback"]
      }));
  }

  return finalResults.slice(0, 7);
}

// ✅ ฟังก์ชันแนะนำรายสัปดาห์ 7 วัน × 3 มื้อ (มี Fallback)
export async function recommendWeekly7Days(userInput, liked_dishes = []) {
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
  const weeklyResults = [];
  const usedMenus = new Set();

  const allRecipes = await fetchRecipesFromFirestore();
  const strictFiltered = filterRecipesByInput(userInput, allRecipes);

  for (let i = 0; i < 7; i++) {
    let dailyMenus = await recommendHybrid(userInput, liked_dishes);

    // ✅ กันเมนูซ้ำ
    dailyMenus = dailyMenus.filter(m => !usedMenus.has(m.name));

    // ✅ Fallback 1: เติมเมนูจาก strictFiltered ให้ครบ 3 มื้อ
    if (dailyMenus.length < 3) {
      const filteredExtra = strictFiltered.filter(r => !usedMenus.has(r.name));
      while (dailyMenus.length < 3 && filteredExtra.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredExtra.length);
        dailyMenus.push({
          name: filteredExtra[randomIndex].name,
          score: 0.5,
          source: ["extra"]
        });
        usedMenus.add(filteredExtra[randomIndex].name);
        filteredExtra.splice(randomIndex, 1);
      }
    }

    // ✅ Fallback 2: ถ้ายังไม่ครบ 3 มื้อ → Random จาก allRecipes
    if (dailyMenus.length < 3) {
      const fallbackExtra = allRecipes.filter(r => !usedMenus.has(r.name));
      while (dailyMenus.length < 3 && fallbackExtra.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackExtra.length);
        dailyMenus.push({
          name: fallbackExtra[randomIndex].name,
          score: 0.1,
          source: ["fallback"]
        });
        usedMenus.add(fallbackExtra[randomIndex].name);
        fallbackExtra.splice(randomIndex, 1);
      }
    }

    dailyMenus.forEach(m => usedMenus.add(m.name));

    weeklyResults.push({
      day: `วัน${days[i]}`,
      meals: [
        { time: "เช้า", name: dailyMenus[0]?.name || "-", score: dailyMenus[0]?.score || 0 },
        { time: "กลางวัน", name: dailyMenus[1]?.name || "-", score: dailyMenus[1]?.score || 0 },
        { time: "เย็น", name: dailyMenus[2]?.name || "-", score: dailyMenus[2]?.score || 0 }
      ]
    });
  }

  return weeklyResults;
}
