// ดึง log จาก Firestore เพื่อใช้กับ Apriori
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

export const fetchRecommendationLogs = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'recommend_logs'))
    const logs = snapshot.docs.map(doc => doc.data())

    // Group by user
    const grouped = {}

    logs.forEach(entry => {
      const user = entry.user || entry.ผู้ใช้ || 'anonymous'
      const menu = entry.menu || entry.ชื่อ || null

      if (!menu) return  // ข้ามถ้าไม่มีชื่อเมนู

      if (!grouped[user]) grouped[user] = []
      grouped[user].push(menu)
    })

    return Object.values(grouped)
  } catch (err) {
    console.error('❌ ดึง log จาก Firestore ล้มเหลว:', err)
    return []
  }
}
