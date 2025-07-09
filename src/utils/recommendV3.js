// recommendV3.js

export default function recommendV3(userInput, recipes = []) {
  return recipes.map(recipe => {
    let score = 0;

    const {
      meats = [],
      veggies = [],
      methods = [],
      favorite = '',
      disliked_dishes = []
    } = userInput;

    // ❌ ตัดคะแนนถ้า user ไม่ชอบเมนูนี้
    if (disliked_dishes.includes(recipe.name)) {
      return { ...recipe, score: -999 };
    }

    // ✅ Match วัตถุดิบ
    const matchedMeats = recipe.ingredients.filter(ing =>
      meats.includes(ing)
    ).length;

    const matchedVeggies = recipe.ingredients.filter(ing =>
      veggies.includes(ing)
    ).length;

    score += matchedMeats * 2;
    score += matchedVeggies * 1.5;

    // ✅ Match วิธีทำ
    if (methods.includes(recipe.method)) {
      score += 2;
    }

    // ✅ เมนูโปรด (ชื่อเมนูมีคำโปรด)
    if (favorite && recipe.name.includes(favorite)) {
      score += 3;
    }

    // ✅ Bonus: ตรง 3 อย่างขึ้นไป
    const totalMatch =
      matchedMeats +
      matchedVeggies +
      (methods.includes(recipe.method) ? 1 : 0);

    if (totalMatch >= 3) {
      score += 1.5;
    }

    return {
      ...recipe,
      score,
    };
  })
    .filter(r => r.score >= 0) // ตัดเมนูที่คะแนนติดลบ
    .sort((a, b) => b.score - a.score); // เรียงจากคะแนนมากไปน้อย
}
