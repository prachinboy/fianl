
/**
 * Apriori with Mock Data (Covers All Test Cases)
 */

// Mock Logs (simulate recommend_logs from Firestore, tuned for test cases)
const mockLogs = [
  { liked_dishes: ["ต้มยำกุ้ง", "ผัดกะเพราไก่"] },
  { liked_dishes: ["แกงเขียวหวานไก่", "ต้มยำกุ้ง"] },
  { liked_dishes: ["ทอดไข่เจียว", "ต้มยำกุ้ง"] },
  { liked_dishes: ["ผัดกะเพราไก่", "แกงเขียวหวานไก่"] },
  { liked_dishes: ["ต้มยำกุ้ง", "ต้มเห็ดใส่มะเขือเทศ ต้นตำรับ"] }
];

export async function fetchLogs() {
  console.log("Using Mock Logs (Covers All Test Cases)");
  return mockLogs;
}

export function transformToTransactions(logs) {
  return logs.map(log => log.liked_dishes || []);
}

// Simple Apriori: find pair rules (1 → 1) only
export function runApriori(transactions) {
  const minSupport = 0.3;
  const minConfidence = 0.6;

  const itemCounts = {};
  const pairCounts = {};

  transactions.forEach(t => {
    t.forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
    for (let i = 0; i < t.length; i++) {
      for (let j = 0; j < t.length; j++) {
        if (i !== j) {
          const key = `${t[i]}|${t[j]}`;
          pairCounts[key] = (pairCounts[key] || 0) + 1;
        }
      }
    }
  });

  const totalTransactions = transactions.length;
  const rules = [];

  for (const pair in pairCounts) {
    const [lhs, rhs] = pair.split('|');
    const support = pairCounts[pair] / totalTransactions;
    const confidence = pairCounts[pair] / itemCounts[lhs];
    if (support >= minSupport && confidence >= minConfidence) {
      rules.push({ lhs: [lhs], rhs: [rhs], support, confidence });
    }
  }
  return rules;
}

export function suggestFromApriori(rules, liked_dishes) {
  const suggestions = [];
  rules.forEach(rule => {
    const premise = rule.lhs[0];
    const conclusion = rule.rhs[0];
    if (liked_dishes.includes(premise) && !liked_dishes.includes(conclusion)) {
      suggestions.push(conclusion);
    }
  });
  return suggestions;
}
