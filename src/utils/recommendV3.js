const synonyms = {
  "ไก่": ["ไก่", "อกไก่", "น่องไก่", "chicken"],
  "หมู": ["หมู", "เนื้อหมู", "pork"],
  "เนื้อ": ["เนื้อ", "เนื้อวัว", "beef"],
  "กุ้ง": ["กุ้ง", "shrimp"],
  "ปลา": ["ปลา", "fish"],
  "เป็ด": ["เป็ด", "duck"]
};

export function recommendV3(userInput, recipes = []) {
  const { meats = [], veggies = [], types = [], favorite = "" } = userInput;

  return recipes.map(recipe => {
    const name = (recipe.name || "").toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());
    const method = (recipe.method || "").toLowerCase();
    const type = (recipe.type || "").toLowerCase();

    let score = 0;
    const source = [];

    let methodMatch = types.some(t => method === t.toLowerCase() || type === t.toLowerCase());
    let meatMatch = meats.some(meat => {
      const syns = synonyms[meat] || [meat];
      return syns.some(s => ingredients.includes(s.toLowerCase()));
    });
    let vegMatch = veggies.some(v => ingredients.includes(v.toLowerCase()));
    let favMatch = favorite && name.includes(favorite.toLowerCase());

    if (methodMatch) {
      score += 2;
      source.push("method");
    }
    if (meatMatch) {
      score += 2;
      source.push("meat");
    }
    if (vegMatch) {
      score += 1.5;
      source.push("veggie");
    }
    if (favMatch) {
      score += 3;
      source.push("favorite");
    }

    let category = "diverse";
    if (methodMatch && meatMatch && vegMatch) category = "strict";
    else if (methodMatch || meatMatch || vegMatch) category = "similar";

    return { name: recipe.name, score, source, category };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score);
}

export default recommendV3;
