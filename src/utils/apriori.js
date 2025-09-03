import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

/** ดึง logs จาก Firestore */
export async function fetchLogs() {
  const logs = [];
  const snapshot = await getDocs(collection(db, 'recommend_logs'));
  snapshot.forEach(doc => logs.push(doc.data()));
  return logs;
}

/** แปลง logs เป็น transactions */
export function transformToTransactions(logs) {
  return logs
    .map(log => log.liked_dishes || [])
    .filter(t => t.length >= 2);
}

/** สร้างกฎ Apriori แบบง่าย */
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

/** แนะนำเมนูจากกฎ Apriori */
export function suggestFromApriori(liked_dishes, rules) {
  const suggestions = new Set();
  rules.forEach(rule => {
    const left = rule.lhs;
    const right = rule.rhs;
    if (left.every(item => liked_dishes.includes(item))) {
      right.forEach(item => suggestions.add(item));
    }
  });
  return [...suggestions];
}
