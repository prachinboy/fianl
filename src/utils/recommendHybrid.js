import { recommendV3 } from './recommendV3.js';
import { fetchLogs, transformToTransactions, runApriori, suggestFromApriori } from './apriori.js';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

export function filterRecipesByInput(userInput, recipes) {
  const safeInput = {
    meats: Array.isArray(userInput.meats) ? userInput.meats : [],
    veggies: Array.isArray(userInput.veggies) ? userInput.veggies : [],
    types: Array.isArray(userInput.types) ? userInput.types : [],
    favorite: userInput.favorite || ""
  };

  return recipes.filter(recipe => {
    const ing = (recipe.ingredients || []).map(i => i.toLowerCase());
    const methodText = (recipe.method || "").toLowerCase();
    const typeText = (recipe.type || "").toLowerCase();
    const nameLower = (recipe.name || "").toLowerCase();

    const meatOk = safeInput.meats.every(m => ing.includes(m.toLowerCase()));
    const vegOk = safeInput.veggies.every(v => ing.includes(v.toLowerCase()));
    const methodOk = safeInput.types.every(t =>
      methodText.includes(t.toLowerCase()) || typeText.includes(t.toLowerCase())
    );
    const favOk = !safeInput.favorite || nameLower.includes(safeInput.favorite.toLowerCase());

    return meatOk && vegOk && methodOk && favOk;
  });
}

export async function recommendHybrid(userInput, liked_dishes = []) {
  const safeInput = {
    meats: Array.isArray(userInput.meats) ? userInput.meats : [],
    veggies: Array.isArray(userInput.veggies) ? userInput.veggies : [],
    types: Array.isArray(userInput.types) ? userInput.types : [],
    favorite: userInput.favorite || ""
  };

  const hasInput = safeInput.meats.length || safeInput.veggies.length || safeInput.types.length || safeInput.favorite;

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

  let v3Results = hasInput
    ? (recommendV3(safeInput, allRecipes) || []).filter(r => strictFiltered.some(f => f.name === r.name))
    : [];

  if (safeInput.favorite) {
    const strictFav = strictFiltered.find(r =>
      (r.name || "").includes(safeInput.favorite)
    );
    if (strictFav) {
      v3Results.push({ name: strictFav.name, score: 20 });
    }
  }

  let aprioriResults = [];
  try {
    const logs = await fetchLogs();
    const transactions = transformToTransactions(logs);
    const rules = runApriori(transactions, 0.1, 0.3);
    const rawApriori = suggestFromApriori(liked_dishes, rules);
    aprioriResults = rawApriori.filter(name =>
      strictFiltered.some(f => f.name === name)
    );
  } catch (err) {
    console.error("❌ Apriori Error:", err);
  }

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

  if (!hasInput && liked_dishes.length) {
    const likedRecipes = allRecipes.filter(r => liked_dishes.includes(r.name));
    const filler = allRecipes.filter(r => !liked_dishes.includes(r.name)).slice(0, 7 - likedRecipes.length);
    finalResults = [...likedRecipes.map(r => ({
      name: r.name,
      score: 1,
      source: ["liked"]
    })), ...filler.map(r => ({
      name: r.name,
      score: 0.5,
      source: ["filler"]
    }))];
  }

  if (finalResults.length < 7) {
    const existingNames = finalResults.map(r => r.name);
    const additional = strictFiltered
      .filter(r => !existingNames.includes(r.name))
      .slice(0, 7 - finalResults.length)
      .map(r => ({ name: r.name, score: 0.5, source: ["extra"] }));
    finalResults = [...finalResults, ...additional];
  }

  if (finalResults.length === 0) {
    finalResults = allRecipes
      .sort(() => Math.random() - 0.5)
      .slice(0, 7)
      .map(r => ({ name: r.name, score: 0.1, source: ["fallback"] }));
  }

  return finalResults.slice(0, 7);
}

export async function recommendWeekly7Days(userInput, liked_dishes = []) {
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
  const weeklyResults = [];
  const usedMenus = new Set();

  const allRecipes = await fetchRecipesFromFirestore();
  const v3Results = recommendV3(userInput, allRecipes);

  const strictMenus = v3Results.filter(r => r.category === "strict");
  const similarMenus = v3Results.filter(r => r.category === "similar");
  const diverseMenus = v3Results.filter(r => r.category === "diverse");

  for (let i = 0; i < 7; i++) {
    const dayMenus = [];

    // 1. เมนูตรงเป๊ะ
    const strict = strictMenus.filter(r => !usedMenus.has(r.name)).slice(0, 2);
    strict.forEach(r => {
      dayMenus.push({ name: r.name, score: r.score, source: r.source });
      usedMenus.add(r.name);
    });

    // 2. เมนูใกล้เคียง (ถ้ายังไม่ครบ)
    if (dayMenus.length < 3) {
      const similar = similarMenus.filter(r => !usedMenus.has(r.name)).slice(0, 1);
      similar.forEach(r => {
        dayMenus.push({ name: r.name, score: r.score, source: r.source });
        usedMenus.add(r.name);
      });
    }

    // 3. เมนูหลากหลาย (ถ้ายังไม่ครบ)
    if (dayMenus.length < 3) {
      const diverse = diverseMenus.filter(r => !usedMenus.has(r.name)).slice(0, 1);
      diverse.forEach(r => {
        dayMenus.push({ name: r.name, score: r.score, source: r.source });
        usedMenus.add(r.name);
      });
    }

    // 4. Fallback (ถ้ายังไม่ครบ)
    const filler = allRecipes.filter(r => !usedMenus.has(r.name));
    while (dayMenus.length < 3 && filler.length > 0) {
      const r = filler.shift();
      dayMenus.push({ name: r.name, score: 0.3, source: ["fallback"] });
      usedMenus.add(r.name);
    }

    weeklyResults.push({
      day: `วัน${days[i]}`,
      meals: [
        { time: "เช้า", name: dayMenus[0]?.name || "-", score: dayMenus[0]?.score || 0 },
        { time: "กลางวัน", name: dayMenus[1]?.name || "-", score: dayMenus[1]?.score || 0 },
        { time: "เย็น", name: dayMenus[2]?.name || "-", score: dayMenus[2]?.score || 0 }
      ]
    });
  }

  return weeklyResults;
}
