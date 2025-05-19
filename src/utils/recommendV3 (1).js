export function recommendMenus(user, recipes) {
  return recipes.map(recipe => {
    let score = 0;

    if (user.disliked_dishes.includes(recipe.name)) return { ...recipe, score: -999 };

    const matchedMeats = recipe.ingredients.filter(ing => user.preferred_meats.includes(ing)).length;
    const matchedVeggies = recipe.ingredients.filter(ing => user.preferred_veggies.includes(ing)).length;

    score += matchedMeats * 2;
    score += matchedVeggies * 1.5;

    if (user.preferred_methods.includes(recipe.method)) score += 2;

    if (user.liked_dishes.includes(recipe.name)) score += 3;

    // บวกพิเศษถ้าเมนูตรงมากกว่า 2 อย่าง
    const totalMatch = matchedMeats + matchedVeggies + (user.preferred_methods.includes(recipe.method) ? 1 : 0);
    if (totalMatch >= 3) score += 1.5;

    return { ...recipe, score };
  })
  .filter(r => r.score >= 0)
  .sort((a, b) => b.score - a.score);
}