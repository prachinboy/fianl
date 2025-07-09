// apriori.js (Browser-safe version for Vue + Firebase)

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

/**
 * 1. ดึง recommend_logs ทั้งหมดจาก Firestore
 */
export const fetchLogs = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'recommend_logs'))
    return snapshot.docs.map(doc => doc.data())
  } catch (error) {
    console.error('❌ Error fetching logs:', error)
    return []
  }
}

/**
 * 2. แปลง logs เป็น transactions: liked_dishes ของผู้ใช้แต่ละคน
 */
export const transformToTransactions = (logs) => {
  return logs
    .map(log => log.userProfile?.liked_dishes || [])
    .filter(items => Array.isArray(items) && items.length > 0)
}

/**
 * 3. สร้างกฎ Apriori แบบง่าย (1 → 1)
 * - minSupport: สัดส่วนคนที่ต้องชอบร่วมกันขั้นต่ำ (0-1)
 * - minConfidence: ความมั่นใจว่า A → B (0-1)
 */
export const runApriori = async (transactions, minSupport = 0.3, minConfidence = 0.6) => {
  const itemsets = {}
  const rules = []
  const total = transactions.length

  // นับความถี่แต่ละเมนู
  transactions.forEach(items => {
    const unique = [...new Set(items)]
    unique.forEach(item => {
      itemsets[item] = (itemsets[item] || 0) + 1
    })
  })

  // กรองเฉพาะเมนูที่ผ่าน support
  const freqItems = Object.entries(itemsets)
    .filter(([_, count]) => count / total >= minSupport)
    .map(([item]) => item)

  // สร้าง rule A → B (เฉพาะเมนูที่ผ่าน support)
  transactions.forEach(items => {
    const filtered = items.filter(i => freqItems.includes(i))
    if (filtered.length < 2) return

    for (let i = 0; i < filtered.length; i++) {
      for (let j = 0; j < filtered.length; j++) {
        if (i === j) continue

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
  })

  return rules
}

/**
 * 4. ใช้กฎ Apriori แนะนำเมนูจากสิ่งที่ผู้ใช้เคย like
 */
export const suggestFromApriori = (userLiked = [], rules = []) => {
  const suggestions = new Set()

  rules.forEach(rule => {
    const { lhs, rhs } = rule
    if (lhs.every(item => userLiked.includes(item))) {
      rhs.forEach(item => {
        if (!userLiked.includes(item)) {
          suggestions.add(item)
        }
      })
    }
  })

  return [...suggestions]
}
