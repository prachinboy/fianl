import { db } from '../firebase/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

export async function fetchLogs() {
  const logs = [];
  const snapshot = await getDocs(collection(db, 'recommend_logs'));
  snapshot.forEach(doc => logs.push(doc.data()));
  return logs;
}

export function transformToTransactions(logs) {
  return logs
    .map(log => log.liked_dishes || [])
    .filter(t => t.length >= 2);
}

export function runApriori(transactions, minSupport = 0.3, minConfidence = 0.6) {
  const itemCount = {};
  const total = transactions.length;
  const rules = [];

  transactions.forEach(items => {
    const uniqueItems = [...new Set(items)];
    uniqueItems.forEach(item => {
      itemCount[item] = (itemCount[item] || 0) + 1;
    });
  });

  const frequentItems = Object.entries(itemCount)
    .filter(([_, count]) => count / total >= minSupport)
    .map(([item]) => item);

  transactions.forEach(items => {
    const filtered = items.filter(i => frequentItems.includes(i));
    if (filtered.length < 2) return;

    for (let i = 0; i < filtered.length; i++) {
      for (let j = 0; j < filtered.length; j++) {
        if (i !== j) {
          const A = filtered[i];
          const B = filtered[j];
          const matchAB = transactions.filter(t => t.includes(A) && t.includes(B)).length;
          const matchA = transactions.filter(t => t.includes(A)).length;
          const confidence = matchAB / matchA;

          if (confidence >= minConfidence) {
            rules.push({ lhs: [A], rhs: [B], confidence });
          }
        }
      }
    }
  });

  return rules;
}

export function suggestFromApriori(liked_dishes, rules) {
  const suggestions = new Set();
  rules.forEach(rule => {
    if (rule.lhs.every(item => liked_dishes.includes(item))) {
      rule.rhs.forEach(item => suggestions.add(item));
    }
  });
  return [...suggestions];
}

export async function generateFilteredRecommendations(userInput, liked_dishes) {
  const logs = await fetchLogs();
  const transactions = transformToTransactions(logs);
  const rules = runApriori(transactions);
  const rawSuggestions = suggestFromApriori(liked_dishes, rules);

  const snapshot = await getDocs(collection(db, 'recipes'));
  const recipesMap = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.name) {
      recipesMap[data.name] = {
        ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(i => i.toLowerCase()) : [],
        method: (data.method || "").toLowerCase(),
        type: (data.type || "").toLowerCase()
      };
    }
  });

  const meats = userInput.meats.map(m => m.toLowerCase());
  const veggies = userInput.veggies.map(v => v.toLowerCase());
  const methods = userInput.types.map(m => m.toLowerCase());

  const filtered = rawSuggestions.filter(name => {
    const recipe = recipesMap[name];
    if (!recipe) return false;

    const ing = recipe.ingredients || [];
    const methodText = recipe.method || "";
    const typeText = recipe.type || "";

    const meatsMatch = meats.every(m => ing.includes(m));
    const veggiesMatch = veggies.every(v => ing.includes(v));
    const methodsMatch = methods.every(m => methodText === m || typeText === m);

    return meatsMatch && veggiesMatch && methodsMatch;
  });

  return filtered.map(name => ({
    name,
    score: 0.5,
    source: ["apriori"],
    category: "diverse"
  }));
}
