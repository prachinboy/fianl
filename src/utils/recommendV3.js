export function recommendV3(userInput, recipes) {
  const { meats = [], veggies = [], types = [], favorite = "" } = userInput;

  const synonyms = {
    "ไก่": ["ไก่", "อกไก่", "น่องไก่", "chicken"],
    "หมู": ["หมู", "เนื้อหมู", "pork"],
    "เนื้อ": ["เนื้อ", "เนื้อวัว", "beef"],
    "กุ้ง": ["กุ้ง", "shrimp"],
    "ปลา": ["ปลา", "fish"],
    "เป็ด": ["เป็ด", "duck"]
  };

  return recipes.map(recipe => {
    let score = 0;
    const name = recipe.name.toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());
    const methodText = (recipe.method || "").toLowerCase();
    const typeText = (recipe.type || "").toLowerCase();

    meats.forEach(meat => {
      const meatSynonyms = synonyms[meat] || [meat];
      meatSynonyms.forEach(syn => {
        if (ingredients.includes(syn.toLowerCase()) || name.includes(syn.toLowerCase())) {
          score += 2;
        }
      });
    });

    veggies.forEach(veg => {
      if (ingredients.includes(veg.toLowerCase()) || name.includes(veg.toLowerCase())) {
        score += 1.5;
      }
    });

    types.forEach(type => {
      if (methodText.includes(type.toLowerCase()) || typeText.includes(type.toLowerCase())) {
        score += 2;
      }
    });

    if (favorite && name.includes(favorite.toLowerCase())) {
      score += 3;
    }

    return {
      name: recipe.name,
      score,
      category:
        score >= 6 ? "strict" :
        score >= 3 ? "similar" :
        score > 0 ? "diverse" : "none"
    };
  }).filter(r => r.score > 0);
}
