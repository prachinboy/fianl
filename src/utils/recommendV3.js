
/**
 * Content-based recommendation (V3)
 * Calculates a score based on meats, veggies, methods, and favorite dishes.
 * @param {Object} userInput - { meats, veggies, methods, favorite }
 * @returns {Array} - Array of recommended recipes with scores
 */

import recipes from '../data/recipes.json';

export function recommendV3(userInput) {
  const { meats = [], veggies = [], methods = [], favorite = "" } = userInput;

  return recipes.map(recipe => {
    let score = 0;
    const name = recipe.name.toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());

    // Score meats
    meats.forEach(meat => {
      if (ingredients.includes(meat.toLowerCase()) || name.includes(meat.toLowerCase())) {
        score += 2;
      }
    });

    // Score veggies
    veggies.forEach(veg => {
      if (ingredients.includes(veg.toLowerCase()) || name.includes(veg.toLowerCase())) {
        score += 1.5;
      }
    });

    // Score methods
    methods.forEach(method => {
      if ((recipe.method || "").toLowerCase().includes(method.toLowerCase())) {
        score += 2;
      }
    });

    // Favorite dish bonus
    if (favorite && name.includes(favorite.toLowerCase())) {
      score += 3;
    }

    // Penalize disliked or irrelevant (optional if needed)
    if (recipe.disliked_dishes && recipe.disliked_dishes.includes(name)) {
      score -= 999;
    }

    return { name: recipe.name, score };
  }).filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export default recommendV3;
