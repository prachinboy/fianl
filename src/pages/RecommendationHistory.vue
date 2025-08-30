<script setup>
import { onMounted, ref } from 'vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const recommendations = ref([])
const loading = ref(true)
const userDisplayName = ref('')

const auth = getAuth()
const user = auth.currentUser

const fetchUserDisplayName = async () => {
  if (!user?.uid) return
  try {
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists() && snap.data().displayName) {
      userDisplayName.value = snap.data().displayName
    } else {
      userDisplayName.value = user.email
    }
  } catch {
    userDisplayName.value = user.email
  }
}

// ✅ โหลดจาก recommend_logs แล้ว flatten resultData[].meals[]
const fetchRecommendationLogs = async () => {
  try {
    const q = query(
      collection(db, 'recommend_logs'),
      where('email', '==', user.email),
      orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)

    const result = []
    snapshot.forEach(docSnap => {
      const data = docSnap.data()
      const days = data.resultData || []

      days.forEach(dayEntry => {
        const day = dayEntry.day || 'ไม่ทราบวัน'
        const meals = dayEntry.meals || []

        meals.forEach(meal => {
          result.push({
            name: meal.name,
            score: meal.score,
            time: meal.time,
            day,
            createdAt: data.timestamp?.seconds
              ? new Date(data.timestamp.seconds * 1000)
              : new Date(),
            type: data.type || 'unknown'
          })
        })
      })
    })

    recommendations.value = result
  } catch (e) {
    console.error('❌ Error loading recommend_logs:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (user?.email) {
    await fetchUserDisplayName()
    await fetchRecommendationLogs()
  }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-purple-50 py-12 px-6 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-8">
      📚 ประวัติการแนะนำเมนูของ {{ userDisplayName || '...' }}
    </h1>

    <div v-if="loading" class="text-center text-gray-500">กำลังโหลด...</div>
    <div v-else-if="recommendations.length === 0" class="text-center text-gray-500">ยังไม่มีประวัติการแนะนำ</div>

    <div class="grid md:grid-cols-2 gap-6" v-else>
      <div
        v-for="(rec, i) in recommendations"
        :key="i"
        class="bg-white p-4 rounded-xl shadow hover:shadow-md transition border border-indigo-200"
      >
        <h2 class="text-lg font-bold text-indigo-600 mb-1">
          🍽️ {{ rec.day }} - {{ rec.time }}: {{ rec.name }}
        </h2>
        <p class="text-sm text-gray-600">
          <strong>คะแนนแนะนำ:</strong> {{ rec.score }}
        </p>
        <p class="text-sm text-gray-400 mt-1">
          📅 วันที่แนะนำ: {{ formatDate(rec.createdAt) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">
  🔖 ประเภท: {{
    rec.type === 'weekly' ? 'รายสัปดาห์' :
    rec.type === 'daily' ? 'รายวัน' :
    rec.type === 'random' ? 'สุ่ม' : 'อื่น ๆ'
  }}
</p>


      </div>
    </div>
  </div>
</template>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
