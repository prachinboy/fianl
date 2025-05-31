// apriori.js (browser-safe version)
// ✅ ทำงานได้ใน Vue + Browser โดยไม่ใช้ node-apriori

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

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

// 3. รัน Apriori (เวอร์ชันทำเองแบบง่าย)
export const runApriori = async (transactions, minSupport = 0.3, minConfidence = 0.6) => {
  const itemsets = {}
  const rules = []
  const total = transactions.length

  // นับ item เดี่ยว
  transactions.forEach(items => {
    const unique = [...new Set(items)]
    unique.forEach(item => {
      itemsets[item] = (itemsets[item] || 0) + 1
    })
  })

  // แปลงเป็น support
  const freqItems = Object.entries(itemsets)
    .filter(([_, count]) => count / total >= minSupport)
    .map(([item]) => item)

  // หา association rule อย่างง่าย
  transactions.forEach(items => {
    const filtered = items.filter(i => freqItems.includes(i))
    if (filtered.length < 2) return

    for (let i = 0; i < filtered.length; i++) {
      for (let j = 0; j < filtered.length; j++) {
        if (i !== j) {
          const A = filtered[i]
          const B = filtered[j]
          const matchAB = transactions.filter(t => t.includes(A) && t.includes(B)).length
          const matchA = transactions.filter(t => t.includes(A)).length
          const confidence = matchAB / matchA

          if (confidence >= minConfidence) {
            rules.push({
              lhs: [A],
              rhs: [B],
              confidence: confidence
            })
          }
        }
      }
    }
  })

  return rules
}

// 4. ใช้กฎที่ได้ แนะนำเมนูใหม่จาก liked_dishes เดิมของผู้ใช้
export const suggestFromApriori = (userLiked = [], rules = []) => {
  const suggestions = new Set()
  rules.forEach(rule => {
    const left = rule.lhs
    const right = rule.rhs

    if (left.every(item => userLiked.includes(item))) {
      right.forEach(item => suggestions.add(item))
    }
  })
  return [...suggestions]
}
