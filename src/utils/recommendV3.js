import { filterRecipesByInput } from './recommendHybrid.js';

const synonyms = {
  "ไก่": ["ไก่", "อกไก่", "น่องไก่", "chicken"],
  "หมู": ["หมู", "เนื้อหมู", "pork"],
  "เนื้อ": ["เนื้อ", "เนื้อวัว", "beef"],
  "กุ้ง": ["กุ้ง", "shrimp"],
  "ปลา": ["ปลา", "fish"],
  "เป็ด": ["เป็ด", "duck"]
};

export function recommendV3(userInput, recipes) {
  const filtered = filterRecipesByInput(userInput, recipes, "relaxed");
  const { meats = [], veggies = [], types = [], favorite = "" } = userInput;

  return filtered.map(recipe => {
    let score = 0;
    const name = recipe.name.toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());
    const methodText = (recipe.method || "").toLowerCase();
    const typeText = (recipe.type || "").toLowerCase();

    meats.forEach(meat => {
      const meatSynonyms = synonyms[meat] || [meat];
      meatSynonyms.forEach(syn => {
        if (ingredients.includes(syn) || name.includes(syn)) score += 2;
      });
    });

    veggies.forEach(veg => {
      if (ingredients.includes(veg.toLowerCase()) || name.includes(veg.toLowerCase())) score += 1.5;
    });

    types.forEach(type => {
      if (methodText.includes(type.toLowerCase()) || typeText.includes(type.toLowerCase())) score += 2;
    });

    if (favorite && name.includes(favorite.toLowerCase())) score += 3;

    const category =
      score >= 6 ? "strict" :
      score >= 3 ? "similar" :
      score > 0 ? "diverse" : "none";

    return { name: recipe.name, score, category };
  }).filter(r => r.score > 0);
}