<script setup>
import { onMounted, ref } from 'vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'

const user = JSON.parse(localStorage.getItem('user') || 'null')
const recommendations = ref([])
const loading = ref(true)
const recipes = ref([])

// ✅ โหลด recipes ทั้งหมดเพื่อใช้จับคู่ ingredients
const fetchRecipes = async () => {
  const snapshot = await getDocs(collection(db, 'recipes'))
  recipes.value = snapshot.docs.map(doc => doc.data())
}

const fetchHistory = async () => {
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
      const recs = data.resultData || []

      recs.forEach(item => {
        // ✅ จับคู่ ingredients จาก recipes
        const found = recipes.value.find(r => r.name === item.name)
        result.push({
          ...item,
          ingredients: found ? found.ingredients : [],
          createdAt: data.timestamp?.seconds
            ? new Date(data.timestamp.seconds * 1000)
            : new Date()
        })
      })
    })

    recommendations.value = result
  } catch (e) {
    console.error('❌ Error loading history:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (user?.email) {
    await fetchRecipes()
    await fetchHistory()
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
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-8">📚 ประวัติการแนะนำเมนู</h1>

    <div v-if="loading" class="text-center text-gray-500">กำลังโหลด...</div>
    <div v-else-if="recommendations.length === 0" class="text-center text-gray-500">ยังไม่มีประวัติการแนะนำ</div>

    <div class="grid md:grid-cols-2 gap-6" v-else>
      <div
        v-for="(rec, i) in recommendations"
        :key="i"
        class="bg-white p-4 rounded-xl shadow hover:shadow-md transition border border-indigo-200"
      >
        <img
          src="https://via.placeholder.com/400x200?text=Menu+Image"
          alt="menu"
          class="w-full h-40 object-cover rounded-lg mb-3"
        />
        <h2 class="text-lg font-bold text-indigo-600 mb-1">🍽️ {{ rec.name }}</h2>
        <p class="text-sm text-gray-600">
          <strong>วัตถุดิบ:</strong> {{ rec.ingredients?.join(', ') || '-' }}
        </p>
        <p class="text-sm text-gray-400 mt-1">
          📅 วันที่แนะนำ: {{ formatDate(rec.createdAt) }}
        </p>
      </div>
    </div>
  </div>
</template>
