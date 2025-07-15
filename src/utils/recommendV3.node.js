
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Load recipes.json with fs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const recipes = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/recipes.json'), 'utf-8')
);

/**
 * Content-based recommendation (Node.js Test Version)
 */
export function recommendV3(userInput) {
  const { meats = [], veggies = [], methods = [], favorite = "" } = userInput;

  return recipes.map(recipe => {
    let score = 0;
    const name = recipe.name.toLowerCase();
    const ingredients = (recipe.ingredients || []).map(i => i.toLowerCase());

    meats.forEach(meat => {
      if (ingredients.includes(meat.toLowerCase()) || name.includes(meat.toLowerCase())) {
        score += 2;
      }
    });

    veggies.forEach(veg => {
      if (ingredients.includes(veg.toLowerCase()) || name.includes(veg.toLowerCase())) {
        score += 1.5;
      }
    });

    methods.forEach(method => {
      if ((recipe.method || "").toLowerCase().includes(method.toLowerCase())) {
        score += 2;
      }
    });

    if (favorite && name.includes(favorite.toLowerCase())) {
      score += 3;
    }

    return { name: recipe.name, score };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score);
}
