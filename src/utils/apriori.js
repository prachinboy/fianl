
import { db } from '../firebase/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Fetch recommend logs from Firestore
 */
export async function fetchLogs() {
  const logs = [];
  const querySnapshot = await getDocs(collection(db, 'recommend_logs'));
  querySnapshot.forEach(doc => {
    logs.push(doc.data());
  });
  return logs;
}

/**
 * Transform logs to transactions for Apriori
 */
export function transformToTransactions(logs) {
  return logs.map(log => log.liked_dishes || []);
}

/**
 * Run Apriori algorithm
 */
export function runApriori(transactions) {
  const Apriori = require('node-apriori');
  const apriori = new Apriori.Algorithm(0.3, 0.6, false);
  const analysisResult = apriori.analyze(transactions);
  return analysisResult.associationRules;
}

/**
 * Suggest from Apriori results
 */
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
