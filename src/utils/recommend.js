export function recommendMenus(user, recipes) {
  return recipes.map(recipe => {
    let score = 0;

    if (user.disliked_dishes.includes(recipe.name)) return { ...recipe, score: -999 };

    const matchedMeats = recipe.ingredients.filter(ing => user.preferred_meats?.includes(ing)).length;
    const matchedVeggies = recipe.ingredients.filter(ing => user.preferred_veggies?.includes(ing)).length;
    const matchedSpices = recipe.ingredients.filter(ing => user.preferred_spices?.includes(ing)).length;

    score += matchedMeats * 2;       // โปรตีนที่ชอบ → น้ำหนักมาก
    score += matchedVeggies * 1.5;   // ผักที่ชอบ
    score += matchedSpices * 1;      // เครื่องเทศที่ชอบ

    if (user.preferred_methods?.includes(recipe.method)) {
      score += 2;                    // วิธีทำตรง
    }

    if (user.liked_dishes.includes(recipe.name)) {
      score += 4;                    // เคยกดถูกใจเมนูนี้
    }

    // พิจารณาความแม่นยำรวม
    const matchCount = matchedMeats + matchedVeggies + matchedSpices + (user.preferred_methods?.includes(recipe.method) ? 1 : 0);
    if (matchCount >= 4) score += 2;   // เมนูที่ตรงหลายอย่าง ให้บวกเพิ่มอีก

    return { ...recipe, score };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score);
}