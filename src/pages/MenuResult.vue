<template> 
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-8">📅 เมนูแนะนำรายสัปดาห์</h1>

    <div v-if="weeklyResults.length === 0" class="text-center text-gray-500">ไม่มีเมนูแนะนำ</div>

    <div class="space-y-6">
      <div
        v-for="(day, index) in weeklyResults"
        :key="index"
        class="bg-white p-5 rounded-xl shadow-md border border-indigo-200"
      >
        <h2 class="text-xl font-bold text-indigo-700 mb-4">📅 {{ day.day }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="meal in day.meals"
            :key="meal.time"
            class="bg-indigo-50 p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 class="text-lg font-semibold text-indigo-600 mb-1">
              {{ meal.time }}: {{ meal.name }}
            </h3>
            <p class="text-sm text-gray-600 mb-3">คะแนนแนะนำ: {{ meal.score.toFixed(1) }}</p>

            <div class="flex gap-2">
              <button
                @click="toggleLike(meal.name)"
                class="px-3 py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200"
              >
                ❤️ {{ likedMenus.includes(meal.name) ? 'ยกเลิก' : 'ถูกใจ' }}
              </button>
              <button
                @click="openReviewModal(meal.name)"
                class="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
              >
                📝 รีวิว
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ Modal รีวิว -->
    <div
      v-if="isReviewModalOpen"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 class="text-lg font-bold text-indigo-600 mb-4">📝 รีวิวเมนู: {{ currentMenuName }}</h2>

        <label class="block text-gray-700 font-semibold mb-2">ให้คะแนน (1-5 ดาว)</label>
        <select v-model="reviewRating" class="w-full border rounded p-2 mb-4">
          <option value="1">1 ดาว</option>
          <option value="2">2 ดาว</option>
          <option value="3">3 ดาว</option>
          <option value="4">4 ดาว</option>
          <option value="5">5 ดาว</option>
        </select>

        <label class="block text-gray-700 font-semibold mb-2">ความคิดเห็น</label>
        <textarea
          v-model="reviewComment"
          placeholder="เขียนความคิดเห็นของคุณ..."
          class="w-full border rounded p-2 mb-4"
          rows="3"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button
            @click="closeReviewModal"
            class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            ❌ ยกเลิก
          </button>
          <button
            @click="submitReview"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            ✅ บันทึก
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const weeklyResults = ref([])
const likedMenus = ref([])

const isReviewModalOpen = ref(false)
const currentMenuName = ref('')
const reviewRating = ref(5)
const reviewComment = ref('')

onMounted(async () => {
  if (route.query.result) {
    weeklyResults.value = JSON.parse(route.query.result)

    const auth = getAuth()
    const user = auth.currentUser
    if (user && weeklyResults.value.length > 0) {
      const resultData = []
      for (const day of weeklyResults.value) {
        for (const meal of day.meals) {
          resultData.push({
            name: meal.name || 'ไม่ทราบชื่อเมนู',
            score: meal.score,
            type: 'weekly',
            day: day.day,
            time: meal.time
          })
        }
      }

      // ✅ เปลี่ยนจาก menu_logs → recommend_logs
      await addDoc(collection(db, 'recommend_logs'), {
        email: user.email,
        resultData,
        timestamp: serverTimestamp()
      })
    }
  }

  const auth = getAuth()
  const user = auth.currentUser
  if (user) {
    const q = query(
      collection(db, 'likes'),
      where('email', '==', user.email),
      orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)
    likedMenus.value = snapshot.docs.map(doc => doc.data().menuName)
  }
})

const toggleLike = async (menuName) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert('❌ กรุณา login ก่อน')
    return
  }

  const isLiked = likedMenus.value.includes(menuName)
  if (isLiked) {
    likedMenus.value = likedMenus.value.filter(m => m !== menuName)
    alert(`ยกเลิกถูกใจเมนู: ${menuName}`)
  } else {
    likedMenus.value.push(menuName)
    alert(`ถูกใจเมนู: ${menuName}`)
  }

  try {
    await addDoc(collection(db, 'likes'), {
      email: user.email,
      menuName,
      liked: !isLiked,
      type: 'weekly',
      timestamp: serverTimestamp()
    })
  } catch (err) {
    console.error('❌ Firestore error:', err)
  }
}

const openReviewModal = (menuName) => {
  currentMenuName.value = menuName
  reviewRating.value = 5
  reviewComment.value = ''
  isReviewModalOpen.value = true
}

const closeReviewModal = () => {
  isReviewModalOpen.value = false
}

const submitReview = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert('❌ กรุณา login ก่อน')
    return
  }

  try {
    await addDoc(collection(db, 'reviews'), {
      email: user.email,
      menuName: currentMenuName.value,
      rating: reviewRating.value,
      comment: reviewComment.value,
      timestamp: serverTimestamp()
    })
    alert(`✅ บันทึกรีวิวเมนู: ${currentMenuName.value}`)
    closeReviewModal()
  } catch (err) {
    console.error('❌ Firestore error:', err)
    alert('เกิดข้อผิดพลาด: ' + err.message)
  }
}
</script>



<style scoped>
/* ใช้ Tailwind CSS */
</style>
