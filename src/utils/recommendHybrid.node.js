
import { recommendV3 } from './recommendV3.node.js';
import { fetchLogs, transformToTransactions, runApriori, suggestFromApriori } from './apriori.node.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// ✅ Load recipes.json with fs (no import JSON directly)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const recipes = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/recipes.json'), 'utf-8')
);

/**
 * Hybrid Recommendation (Node.js Test Version - Final)
 */
export async function recommendHybrid(userInput, liked_dishes) {
  const safeInput = {
    meats: userInput.meats || [],
    veggies: userInput.veggies || [],
    methods: userInput.methods || [],
    favorite: userInput.favorite || ""
  };

  const v3Results = recommendV3(safeInput);
  const logs = await fetchLogs();
  const transactions = transformToTransactions(logs);
  const aprioriResults = suggestFromApriori(runApriori(transactions), liked_dishes);

  let lstmResults = [];
  try {
    const res = await axios.post('http://127.0.0.1:5000/recommend-lstm', {
      liked_dishes: liked_dishes
    });
    lstmResults = res.data.recommendations || [];
  } catch (error) {
    console.error('LSTM API error:', error);
  }

  const allResults = {};
  function addOrUpdate(dish, score, source) {
    if (!allResults[dish]) {
      allResults[dish] = { score: 0, source: [] };
    }
    allResults[dish].score += score;
    if (!allResults[dish].source.includes(source)) {
      allResults[dish].source.push(source);
    }
  }

  function isRelevant(dishName) {
    const recipe = recipes.find(r => r.name === dishName);
    if (!recipe) return false;

    const { meats, veggies, methods, favorite } = safeInput;
    const ing = (recipe.ingredients || []).map(i => i.toLowerCase());
    const methodText = (recipe.method || "").toLowerCase();
    const nameLower = recipe.name.toLowerCase();

    const meatOk = !meats.length || meats.some(m => ing.includes(m.toLowerCase()) || nameLower.includes(m.toLowerCase()));
    const vegOk = !veggies.length || veggies.some(v => ing.includes(v.toLowerCase()) || nameLower.includes(v.toLowerCase()));
    const methodOk = !methods.length || methods.some(m => methodText.includes(m.toLowerCase()));
    const favOk = !favorite || nameLower.includes(favorite.toLowerCase());

    return meatOk && vegOk && methodOk && favOk;
  }

  v3Results.forEach(r => addOrUpdate(r.name, r.score * 1.5, 'v3'));
  aprioriResults.filter(d => isRelevant(d)).forEach(d => addOrUpdate(d, 3, 'apriori'));
  lstmResults.filter(d => isRelevant(d)).forEach(d => addOrUpdate(d, 2, 'lstm'));

  return Object.entries(allResults)
    .map(([name, { score, source }]) => ({ name, score, source }))
    .sort((a, b) => b.score - a.score);
}
