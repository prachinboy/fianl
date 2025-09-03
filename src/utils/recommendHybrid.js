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
  if (!Array.isArray(allRecipes) || allRecipes.length === 0) {
    console.warn("⚠️ No recipes found from Firestore");
    return [];
  }

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
  function addOrUpdate(recipe, score, source) {
    if (!recipe || !recipe.name) return;
    if (!allResults[recipe.name]) {
      allResults[recipe.name] = { score: 0, source: [], recipe };
    }
    allResults[recipe.name].score += score;
    if (!allResults[recipe.name].source.includes(source)) {
      allResults[recipe.name].source.push(source);
    }
  }

  strictV3.forEach(r => addOrUpdate(allRecipes.find(x => x.name === r.name), r.score * 1.5, 'strict'));
  similarV3.forEach(r => addOrUpdate(allRecipes.find(x => x.name === r.name), r.score, 'similar'));
  diverseV3.forEach(r => addOrUpdate(allRecipes.find(x => x.name === r.name), r.score * 0.8, 'diverse'));
  aprioriResults.forEach(r => addOrUpdate(r, 1.5, 'apriori'));

  let finalResults = Object.entries(allResults)
    .map(([name, { score, source, recipe }]) => ({ name, score, source, recipe }))
    .filter(r => r.recipe && r.name)
    .sort((a, b) => b.score - a.score);

  const used = new Set(finalResults.map(r => r.name));

  // 🧠 Curated override สำหรับเมนูเบา/กลาง/หนัก
  const mealWeightOverrides = {
    light: [
      "ข้าวต้ม", "น้ำเต้าหู้", "ซุป", "บะหมี่น้ำ", "แกงจืด", "ผัดบวบใส่ไข่", "ผัดฟักทองไข่"
    ],
    medium: [
      "ข้าวผัด", "ผัดซีอิ๊ว", "ผัดเต้าหู้หมู", "ผัดหน่อไม้", "ผัดคะน้าหมูกรอบ", "ข้าวหน้าไก่"
    ],
    heavy: [
      "ต้มยำ", "แกงพะแนง", "แกงมัสมั่น", "ลาบ", "ห่อหมก", "ข้าวหมูแดง", "หมูกรอบ",
      "สะโพกไก่ทอด", "ผัดพริกแกง", "ข้าวคลุกกะปิ"
    ]
  };

  function classifyMealWeight(recipe) {
    const name = (recipe.name || "").toLowerCase();
    const method = (recipe.method || "").toLowerCase();
    const ingredients = recipe.ingredients?.map(i => i.toLowerCase()) || [];

    if (mealWeightOverrides.light.some(n => name.includes(n))) return "light";
    if (mealWeightOverrides.medium.some(n => name.includes(n))) return "medium";
    if (mealWeightOverrides.heavy.some(n => name.includes(n))) return "heavy";

    let score = 0;
    if (/ต้ม|นึ่ง|ซุป/.test(method)) score -= 2;
    if (/ผัด|แกงจืด/.test(method)) score += 0;
    if (/ทอด|ย่าง|อบ|แกงเผ็ด/.test(method)) score += 2;

    if (ingredients.some(i => /เต้าหู้|ไข่/.test(i))) score -= 1;
    if (ingredients.some(i => /หมู|เนื้อ|เป็ด/.test(i))) score += 2;

    if (score <= -1) return "light";
    if (score <= 1) return "medium";
    return "heavy";
  }

  const fallback = allRecipes
    .filter(r => !used.has(r.name))
    .map(r => ({
      name: r.name,
      score: 0.1,
      source: ["filler"],
      recipe: r,
      weight: classifyMealWeight(r)
    }));

  const light = fallback.find(r => r.weight === "light");
  const medium = fallback.find(r => r.weight === "medium");
  const heavy = fallback.find(r => r.weight === "heavy");

  const filler = [light, medium, heavy].filter(r => r && r.name);

  if (finalResults.length < 7) {
    const remaining = 7 - finalResults.length;
    finalResults = [...finalResults, ...filler.slice(0, remaining)];
  }

  if (finalResults.length === 0) {
    finalResults = allRecipes.slice(0, 7).map(r => ({
      name: r.name,
      score: 0.1,
      source: ["default"],
      recipe: r
    }));
  }

  return finalResults.slice(0, 7);
}

export async function recommendWeekly7Days(userInput, liked_dishes = []) {
  const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
  const weeklyResults = [];
  const usedMenus = new Set();

  const allRecipes = await fetchRecipesFromFirestore();
  if (!Array.isArray(allRecipes) || allRecipes.length === 0) {
    console.warn("⚠️ No recipes found from Firestore");
    return [];
  }

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

  const allCandidates = [
    ...strictMenus,
    ...aprioriMenus,
    ...similarMenus,
    ...diverseMenus
  ].map(r => allRecipes.find(x => x.name === r.name)).filter(r => r && r.name);

  // 🧠 Curated override สำหรับเมนูเบา/กลาง/หนัก
  const mealWeightOverrides = {
    light: [
      "ข้าวต้ม", "น้ำเต้าหู้", "ซุป", "บะหมี่น้ำ", "แกงจืด", "ผัดบวบใส่ไข่", "ผัดฟักทองไข่"
    ],
    medium: [
      "ข้าวผัด", "ผัดซีอิ๊ว", "ผัดเต้าหู้หมู", "ผัดหน่อไม้", "ผัดคะน้าหมูกรอบ", "ข้าวหน้าไก่"
    ],
    heavy: [
      "ต้มยำ", "แกงพะแนง", "แกงมัสมั่น", "ลาบ", "ห่อหมก", "ข้าวหมูแดง", "หมูกรอบ",
      "สะโพกไก่ทอด", "ผัดพริกแกง", "ข้าวคลุกกะปิ"
    ]
  };

  function classifyMealWeight(recipe) {
    const name = (recipe.name || "").toLowerCase();
    const method = (recipe.method || "").toLowerCase();
    const ingredients = recipe.ingredients?.map(i => i.toLowerCase()) || [];

    if (mealWeightOverrides.light.some(n => name.includes(n))) return "light";
    if (mealWeightOverrides.medium.some(n => name.includes(n))) return "medium";
    if (mealWeightOverrides.heavy.some(n => name.includes(n))) return "heavy";

    let score = 0;
    if (/ต้ม|นึ่ง|ซุป/.test(method)) score -= 2;
    if (/ผัด|แกงจืด/.test(method)) score += 0;
    if (/ทอด|ย่าง|อบ|แกงเผ็ด/.test(method)) score += 2;

    if (ingredients.some(i => /เต้าหู้|ไข่/.test(i))) score -= 1;
    if (ingredients.some(i => /หมู|เนื้อ|เป็ด/.test(i))) score += 2;

    if (score <= -1) return "light";
    if (score <= 1) return "medium";
    return "heavy";
  }

  for (let i = 0; i < 7; i++) {
    const pickMeal = (weight) => {
      return allCandidates.find(r => !usedMenus.has(r.name) && classifyMealWeight(r) === weight)
          || allRecipes.find(r => !usedMenus.has(r.name) && classifyMealWeight(r) === weight);
    };

    const breakfast = pickMeal("light") || allRecipes.find(r => !usedMenus.has(r.name));
    const lunch = pickMeal("medium") || allRecipes.find(r => !usedMenus.has(r.name));
    const dinner = pickMeal("heavy") || allRecipes.find(r => !usedMenus.has(r.name));

    const safeMeals = [breakfast, lunch, dinner].filter(r => r && r.name);
    safeMeals.forEach(r => usedMenus.add(r.name));

    weeklyResults.push({
      day: `วัน${days[i]}`,
      meals: [
        { time: "เช้า", name: breakfast?.name || "-", score: 1 },
        { time: "กลางวัน", name: lunch?.name || "-", score: 1 },
        { time: "เย็น", name: dinner?.name || "-", score: 1 }
      ]
    });
  }

  return weeklyResults;
}
