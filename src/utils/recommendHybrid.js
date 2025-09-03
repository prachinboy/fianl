import { recommendV3 } from './recommendV3.js';
import { getAprioriSuggestions } from './apriori.js';
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

export async function fetchRecipesFromFirestore() {
  const snapshot = await getDocs(collection(db, "recipes"));
  return snapshot.docs.map(doc => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      name: data.name || "",
      ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(i => i.toLowerCase()) : [],
      method: (data.method || "").toLowerCase(),
      type: (data.type || "").toLowerCase()
    };
  }).filter(r => r.name);
}

export function filterRecipesByInput(userInput, recipes, mode = "strict") {
  const safeInput = {
    meats: Array.isArray(userInput.meats) ? userInput.meats : [],
    veggies: Array.isArray(userInput.veggies) ? userInput.veggies : [],
    types: Array.isArray(userInput.types) ? userInput.types : [],
    favorite: userInput.favorite || ""
  };

  return recipes.filter(recipe => {
    const ing = Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map(i => (i || "").toLowerCase())
      : [];
    const methodText = (recipe.method || "").toLowerCase();
    const typeText = (recipe.type || "").toLowerCase();
    const nameLower = (recipe.name || "").toLowerCase();

    const hasSelectedMeat =
      !safeInput.meats.length ||
      safeInput.meats.every(m =>
        (synonyms[m] || [m]).some(syn =>
          ing.some(i => i.includes(syn.toLowerCase())) || nameLower.includes(syn.toLowerCase())
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
        ing.some(i => i.includes(v.toLowerCase())) || nameLower.includes(v.toLowerCase())
      );

    const methodOk =
      !safeInput.types.length ||
      safeInput.types.every(t =>
        methodText.includes(t.toLowerCase()) || typeText.includes(t.toLowerCase())
      );

    const favOk =
      !safeInput.favorite || nameLower.includes(safeInput.favorite.toLowerCase());

    return mode === "strict"
      ? hasSelectedMeat && noOtherMeat && vegOk && methodOk && favOk
      : hasSelectedMeat && vegOk && methodOk && favOk;
  });
}
export async function recommendHybrid(userInput, liked_dishes = []) {
  const hasInput = userInput.meats?.length || userInput.veggies?.length || userInput.types?.length || userInput.favorite;

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
  const strictFiltered = filterRecipesByInput(userInput, allRecipes, "strict");
  const relaxedFiltered = filterRecipesByInput(userInput, allRecipes, "relaxed");
  const v3Results = recommendV3(userInput, allRecipes);

  const strictV3 = v3Results.filter(r => r.category === "strict" && strictFiltered.some(f => f.name === r.name));
  const similarV3 = v3Results.filter(r => r.category === "similar" && relaxedFiltered.some(f => f.name === r.name));
  const diverseV3 = v3Results.filter(r => r.category === "diverse" && relaxedFiltered.some(f => f.name === r.name));

  let aprioriResults = [];
  try {
    const rawApriori = await getAprioriSuggestions(liked_dishes);
    aprioriResults = rawApriori
      .map(name => allRecipes.find(r => r.name === name))
      .filter(r => r && relaxedFiltered.some(f => f.name === r.name));
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

  strictV3.forEach(r => addOrUpdate(r.name, r.score * 1.5, 'strict'));
  similarV3.forEach(r => addOrUpdate(r.name, r.score, 'similar'));
  diverseV3.forEach(r => addOrUpdate(r.name, r.score * 0.8, 'diverse'));
  aprioriResults.forEach(r => addOrUpdate(r.name, 1.5, 'apriori'));

  let finalResults = Object.entries(allResults)
    .map(([name, { score, source }]) => ({ name, score, source }))
    .sort((a, b) => b.score - a.score);

  const existingNames = finalResults.map(r => r.name);

  if (finalResults.length < 7) {
    const filler = allRecipes
      .filter(r => !existingNames.includes(r.name))
      .sort(() => Math.random() - 0.5)
      .slice(0, 7 - finalResults.length)
      .map(r => ({ name: r.name, score: 0.1, source: ["filler"] }));
    finalResults = [...finalResults, ...filler];
  }

  return finalResults.slice(0, 7);
}


export async function recommendWeekly7Days(userInput, liked_dishes = []) {
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
  const weeklyResults = [];
  const usedMenus = new Set();

  const allRecipes = await fetchRecipesFromFirestore();
  const strictFiltered = filterRecipesByInput(userInput, allRecipes, "strict");
  const relaxedFiltered = filterRecipesByInput(userInput, allRecipes, "relaxed");
  const v3Results = recommendV3(userInput, allRecipes);

  const strictMenus = v3Results.filter(r => r.category === "strict" && strictFiltered.some(f => f.name === r.name));
  const similarMenus = v3Results.filter(r => r.category === "similar" && relaxedFiltered.some(f => f.name === r.name));
  const diverseMenus = v3Results.filter(r => r.category === "diverse" && relaxedFiltered.some(f => f.name === r.name));

  let aprioriMenus = [];
  try {
    const rawApriori = await getAprioriSuggestions(liked_dishes);
    aprioriMenus = rawApriori
      .map(name => allRecipes.find(r => r.name === name))
      .filter(r => r && relaxedFiltered.some(f => f.name === r.name));
  } catch (err) {
    console.error("❌ Apriori Error:", err);
  }

  for (let i = 0; i < 7; i++) {
    const dayMenus = [];

    const strict = strictMenus.filter(r => !usedMenus.has(r.name)).slice(0, 2);
    strict.forEach(r => {
      dayMenus.push({ name: r.name, score: r.score, source: r.source });
      usedMenus.add(r.name);
    });

    if (dayMenus.length < 3) {
      const apriori = aprioriMenus.filter(r => !usedMenus.has(r.name)).slice(0, 1);
      apriori.forEach(r => {
        dayMenus.push({ name: r.name, score: r.score, source: r.source });
        usedMenus.add(r.name);
      });
    }

    if (dayMenus.length < 3) {
      const similar = similarMenus.filter(r => !usedMenus.has(r.name)).slice(0, 1);
      similar.forEach(r => {
        dayMenus.push({ name: r.name, score: r.score, source: r.source });
        usedMenus.add(r.name);
      });
    }

    if (dayMenus.length < 3) {
      const diverse = diverseMenus.filter(r => !usedMenus.has(r.name)).slice(0, 1);
      diverse.forEach(r => {
        dayMenus.push({ name: r.name, score: r.score, source: r.source });
        usedMenus.add(r.name);
      });
    }

    if (dayMenus.length < 3) {
      const filler = allRecipes.filter(r => !usedMenus.has(r.name));
      while (dayMenus.length < 3 && filler.length > 0) {
        const r = filler.shift();
        dayMenus.push({ name: r.name, score: 0.1, source: ["filler"] });
        usedMenus.add(r.name);
      }
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
