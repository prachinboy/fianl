const synonyms = {
  "ไก่": ["ไก่", "อกไก่", "น่องไก่", "chicken"],
  "หมู": ["หมู", "เนื้อหมู", "pork"],
  "เนื้อ": ["เนื้อ", "เนื้อวัว", "beef"],
  "กุ้ง": ["กุ้ง", "shrimp"],
  "ปลา": ["ปลา", "fish"],
  "เป็ด": ["เป็ด", "duck"]
};

export function recommendV3(userInput, recipes = []) {
  const meats = Array.isArray(userInput.meats) ? userInput.meats.map(m => m.toLowerCase()) : [];
  const veggies = Array.isArray(userInput.veggies) ? userInput.veggies.map(v => v.toLowerCase()) : [];
  const types = Array.isArray(userInput.types) ? userInput.types.map(t => t.toLowerCase()) : [];
  const favorite = userInput.favorite?.toLowerCase() || "";

  return recipes.map(recipe => {
    const name = (recipe.name || "").toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());
    const method = (recipe.method || "").toLowerCase();
    const type = (recipe.type || "").toLowerCase();

    let score = 0;
    const source = [];

    // ✅ กรอง method/type แบบ exact
    const methodMatch = types.every(t => method === t || type === t);
    if (methodMatch && types.length > 0) {
      score += 2;
      source.push("method");
    }

    // ✅ กรอง meats แบบครบทุกตัวผ่าน synonyms
    const meatMatch = meats.every(meat => {
      const syns = synonyms[meat] || [meat];
      return syns.some(s => ingredients.includes(s));
    });
    if (meatMatch && meats.length > 0) {
      score += 2;
      source.push("meat");
    }

    // ✅ กรอง veggies แบบครบทุกตัว
    const vegMatch = veggies.every(v => ingredients.includes(v));
    if (vegMatch && veggies.length > 0) {
      score += 1.5;
      source.push("veggie");
    }

    // ✅ กรอง favorite
    const favMatch = favorite && name.includes(favorite);
    if (favMatch) {
      score += 3;
      source.push("favorite");
    }

    // ✅ กำหนด category แบบเป๊ะ
    const isStrict = methodMatch && meatMatch && vegMatch;
    const isSimilar = methodMatch || meatMatch || vegMatch;

    let category = "diverse";
    if (isStrict) category = "strict";
    else if (isSimilar) category = "similar";

    return { name: recipe.name, score, source, category };
  })
  .filter(r => {
    // ✅ กรองให้ผ่านทุกเงื่อนไขพร้อมกันก่อนถือว่า strict จริง
    const required = [];
    if (meats.length) required.push("meat");
    if (veggies.length) required.push("veggie");
    if (types.length) required.push("method");
    if (favorite) required.push("favorite");

    return required.every(req => r.source.includes(req));
  })
  .sort((a, b) => b.score - a.score);
}

export default recommendV3;
