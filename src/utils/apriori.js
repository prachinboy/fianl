// apriori.js
// ✅ ใช้ Apriori Algorithm เพื่อสร้างกฎความสัมพันธ์ของเมนูที่ผู้ใช้ชอบร่วมกัน

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'
import Apriori from 'node-apriori'

// 1. ดึง logs จาก Firestore
export const fetchLogs = async () => {
  const snapshot = await getDocs(collection(db, 'recommend_logs'))
  return snapshot.docs.map(doc => doc.data())
}

// 2. แปลง logs เป็น Transaction Dataset
export const transformToTransactions = (logs) => {
  return logs
    .map(log => log.userProfile?.liked_dishes || [])
    .filter(items => items.length > 0)
}

// 3. รัน Apriori เพื่อหากฎความสัมพันธ์
export const runApriori = (transactions, minSupport = 0.3, minConfidence = 0.6) => {
  const apriori = new Apriori(minSupport, minConfidence, false)
  return new Promise((resolve) => {
    apriori.exec(transactions).then(result => {
      resolve(result.associationRules)
    })
  })
}

// 4. ใช้กฎที่ได้ แนะนำเมนูใหม่จาก liked_dishes เดิมของผู้ใช้
export const suggestFromApriori = (userLiked = [], rules = []) => {
  const suggestions = new Set()
  rules.forEach(rule => {
    const left = rule.lhs
    const right = rule.rhs
    const confidence = rule.confidence

    if (left.every(item => userLiked.includes(item))) {
      right.forEach(item => suggestions.add(item))
    }
  })
  return [...suggestions]
}

// ✅ วิธีใช้งาน (เชื่อมกับระบบแนะนำหลัก)
// const logs = await fetchLogs()
// const transactions = transformToTransactions(logs)
// const rules = await runApriori(transactions)
// const aprioriSuggestions = suggestFromApriori(currentUserLikedDishes, rules)
