// ✅ ดึง log จริงจาก Firestore เพื่อใช้สร้าง Association Rules

import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

export const fetchRecommendationLogs = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'recommend_logs'))
    const logs = snapshot.docs.map(doc => doc.data())

    // ดึงเฉพาะชื่อเมนูจากแต่ละ log แล้วจัดกลุ่มตาม user
    const grouped = {}

    logs.forEach(entry => {
      const user = entry.ผู้ใช้ || 'anonymous'
      if (!grouped[user]) grouped[user] = []
      grouped[user].push(entry.ชื่อ) // หรือเปลี่ยนเป็น entry.เมนู ถ้าใช้ key อื่น
    })

    // คืนค่าเป็น array ของ array (สำหรับใช้ใน Apriori)
    return Object.values(grouped)
  } catch (err) {
    console.error('❌ ดึง log จาก Firestore ล้มเหลว:', err)
    return []
  }
}