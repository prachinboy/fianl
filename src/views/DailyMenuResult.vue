<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-8">🍽️ เมนูแนะนำประจำวัน</h1>

    <div v-if="menus.length === 0" class="text-center text-gray-500">ไม่มีเมนูแนะนำ</div>

    <div class="space-y-6">
      <div
        v-for="(menu, index) in menus"
        :key="index"
        class="bg-white p-4 rounded-xl shadow hover:shadow-md transition border border-indigo-200"
      >
        <h2 class="text-lg font-bold text-indigo-600 mb-1">
          {{ mealTime[index] }}: {{ menu.name }}
        </h2>
        <p class="text-sm text-gray-600 mb-2">คะแนนแนะนำ: {{ menu.score }}</p>

        <div class="flex gap-2">
          <button
            @click="toggleLike(menu.name)"
            class="px-3 py-1 rounded bg-pink-100 text-pink-600 hover:bg-pink-200"
          >
            ❤️ {{ likedMenus.includes(menu.name) ? 'ยกเลิก' : 'ถูกใจ' }}
          </button>

          <button
            @click="openReviewModal(menu.name)"
            class="px-3 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
          >
            📝 รีวิว
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ Modal รีวิว -->
    <div v-if="isReviewModalOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
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
          <button @click="closeReviewModal" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">❌ ยกเลิก</button>
          <button @click="submitReview" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">✅ บันทึก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const router = useRouter()

const menus = ref([])
const likedMenus = ref([])
const mealTime = ['เช้า', 'กลางวัน', 'เย็น']

// ✅ Modal รีวิว
const isReviewModalOpen = ref(false)
const currentMenuName = ref('')
const reviewRating = ref(5)
const reviewComment = ref('')

onMounted(async () => {
  if (route.query.result) {
    menus.value = JSON.parse(route.query.result)

    const auth = getAuth()
    const user = auth.currentUser
    if (user && menus.value.length > 0) {
      const resultData = [
        {
          day: 'เมนูรายวัน',
          meals: menus.value.map((menu, index) => ({
            name: menu.name,
            score: menu.score,
            time: mealTime[index] || 'ไม่ระบุ'
          }))
        }
      ]

      await addDoc(collection(db, 'recommend_logs'), {
        email: user.email,
        resultData,
        type: 'daily',
        timestamp: serverTimestamp()
      })
    }
  }
})


const toggleLike = async (menuName) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert('❌ กรุณา login ก่อน')
    return
  }

  if (likedMenus.value.includes(menuName)) {
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
      liked: likedMenus.value.includes(menuName),
      timestamp: serverTimestamp()
    })
  } catch (err) {
    console.error('❌ Firestore error:', err)
  }
}

// ✅ เปิด-ปิด Modal รีวิว
const openReviewModal = (menuName) => {
  currentMenuName.value = menuName
  reviewRating.value = 5
  reviewComment.value = ''
  isReviewModalOpen.value = true
}

const closeReviewModal = () => {
  isReviewModalOpen.value = false
}

// ✅ บันทึกรีวิว
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

const goToDetail = (menuName) => {
  router.push({ path: '/menu-detail', query: { menu: menuName } })
}
</script>

<style scoped>
/* ใช้ Tailwind CSS */
</style>
