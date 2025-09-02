import { db } from '../firebase/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Fetch logs from Firestore
 */
export async function fetchLogs() {
  const logs = [];
  const snapshot = await getDocs(collection(db, 'recommend_logs'));
  snapshot.forEach(doc => logs.push(doc.data()));
  return logs;
}

/**
 * Transform logs to transactions (Only keep logs with at least 2 dishes)
 */
export function transformToTransactions(logs) {
  return logs
    .map(log => log.liked_dishes || [])
    .filter(t => t.length >= 2); // ใช้เฉพาะ log ที่มีเมนู ≥ 2
}

/**
 * Simple Apriori Implementation (Browser Safe)
 */
export function runApriori(transactions, minSupport = 0.3, minConfidence = 0.6) {
  const itemCount = {};
  const total = transactions.length;
  const rules = [];

  // นับเมนูเดี่ยว
  transactions.forEach(items => {
    const uniqueItems = [...new Set(items)];
    uniqueItems.forEach(item => {
      itemCount[item] = (itemCount[item] || 0) + 1;
    });
  });

  // คัดเมนูที่ผ่าน support
  const frequentItems = Object.entries(itemCount)
    .filter(([_, count]) => count / total >= minSupport)
    .map(([item]) => item);

  // สร้างกฎแบบง่าย
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

/**
 * Suggest from Apriori rules
 */
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

/**
 * Main Apriori Function with filtering to prevent incorrect dish recommendations
 * This filters out recommendations that don't match the user's selected inputs
 * while still allowing apriori-based recommendations when no strict input is provided.
 */
export async function generateFilteredRecommendations(userInput, liked_dishes) {
  const logs = await fetchLogs(); // ดึงข้อมูลการกดไลค์จาก Firestore
  const transactions = transformToTransactions(logs); // แปลงข้อมูลการกดไลค์เป็นรายการเมนูที่ผู้ใช้ชอบ
  
  // Run Apriori algorithm to get association rules
  const rules = runApriori(transactions); // คำนวณกฎ Apriori
  
  // Filter recommendations based on user-selected ingredients and preferred dish types
  let filteredRecommendations = suggestFromApriori(liked_dishes, rules);

  // Apply user preferences (filtering recommendations based on meats, veggies, methods, etc.)
  filteredRecommendations = filteredRecommendations.filter(recipe => {
    // ตรวจสอบว่าเมนูตรงกับการเลือกของผู้ใช้หรือไม่
    const recipeIngredients = recipe.toLowerCase().split(','); // Assuming recipe is a string with comma-separated ingredients
    const meatsMatch = userInput.meats.every(meat => recipeIngredients.includes(meat.toLowerCase()));
    const veggiesMatch = userInput.veggies.every(veg => recipeIngredients.includes(veg.toLowerCase()));
    const methodsMatch = userInput.methods.every(method => recipe.includes(method.toLowerCase()));
    
    return meatsMatch && veggiesMatch && methodsMatch;
  });

  return filteredRecommendations; // คืนค่ารายการเมนูที่กรองแล้ว
}
