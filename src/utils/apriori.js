import { fetchRecommendationLogs } from './fetchLogsFromFirestore.js';

export function transformToTransactions(logs) {
  return logs
    .map(group => Array.isArray(group) ? [...new Set(group)] : [])
    .filter(t => t.length >= 2);
}

export function runApriori(transactions, minSupport = 0.3, minConfidence = 0.6) {
  const itemCount = {};
  const total = transactions.length;
  const rules = [];

  transactions.forEach(items => {
    items.forEach(item => {
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

export async function getAprioriSuggestions(liked_dishes) {
  try {
    const logs = await fetchRecommendationLogs();
    const transactions = transformToTransactions(logs);
    const rules = runApriori(transactions, 0.1, 0.3);
    return suggestFromApriori(liked_dishes, rules);
  } catch (err) {
    console.error("❌ Apriori Error:", err);
    return [];
  }
}
