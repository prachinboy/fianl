<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore'

const route = useRoute()
const raw = route.query.result ? JSON.parse(route.query.result) : []

const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
const shuffled = [...raw].sort(() => Math.random() - 0.5)

const menuItems = ref(
  days.map((day, index) => ({
    day,
    name: shuffled[index]?.name ?? '-',
    type: shuffled[index]?.type ?? '-',
    score: shuffled[index]?.score ?? '-'
  }))
)

const colorClasses = [
  'bg-red-50', 'bg-orange-50', 'bg-yellow-50', 'bg-green-50',
  'bg-blue-50', 'bg-indigo-50', 'bg-purple-50', 'bg-pink-50'
]

// ✅ ฟังก์ชันกดถูกใจ / เลิกถูกใจ (Toggle Like)
const likeMenu = async (menuName) => {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนกดถูกใจเมนู')
    return
  }

  try {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    let liked = []
    if (userSnap.exists()) {
      liked = userSnap.data().liked_dishes || []
    }

    if (liked.includes(menuName)) {
      // ✅ ถ้ากดซ้ำ → ลบออก
      liked = liked.filter((dish) => dish !== menuName)
      alert(`❌ ยกเลิกถูกใจเมนู: ${menuName}`)
    } else {
      // ✅ ถ้ายังไม่กด → เพิ่มใหม่
      liked.push(menuName)
      await addDoc(collection(db, 'recommend_logs'), {
        userId: user.uid,
        liked_dishes: [menuName],
        timestamp: serverTimestamp()
      })
      alert(`✅ คุณถูกใจเมนู: ${menuName}`)
    }

    await updateDoc(userRef, { liked_dishes: liked })
  } catch (err) {
    console.error('❌ Error updating likes:', err.message)
    alert('เกิดข้อผิดพลาดในการกดถูกใจ')
  }
}

// ------------------- ✅ ส่วนรีวิว -------------------
const reviewingMenu = ref(null)
const reviewRating = ref(5)
const reviewComment = ref('')

// เปิด Modal รีวิว
const openReview = (menuName) => {
  reviewingMenu.value = menuName
  reviewRating.value = 5
  reviewComment.value = ''
}

// ยกเลิกรีวิว
const cancelReview = () => {
  reviewingMenu.value = null
}

// บันทึกรีวิว
const saveReview = async () => {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนรีวิว')
    return
  }

  try {
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    const newReview =
      '⭐'.repeat(reviewRating.value) +
      ` ${reviewingMenu.value} - ${reviewComment.value}`

    let reviews = []
    if (userSnap.exists()) {
      reviews = userSnap.data().reviews || []
    }
    reviews.push(newReview)

    await updateDoc(userRef, { reviews })

    alert('✅ รีวิวสำเร็จ!')
    reviewingMenu.value = null
  } catch (err) {
    console.error('❌ Error saving review:', err.message)
    alert('เกิดข้อผิดพลาดในการบันทึกรีวิว')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-white to-[#fff0f6] py-12 px-4">
    <h1 class="text-4xl font-bold text-center text-indigo-700 mb-12 tracking-tight">
      🍽️ เมนูอาหารแนะนำสำหรับสัปดาห์นี้
    </h1>

    <div v-if="menuItems.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
      <div
        v-for="(item, index) in menuItems"
        :key="index"
        :class="[
          'rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-200',
          colorClasses[index % colorClasses.length]
        ]"
      >
        <!-- รูปเมนู -->
        <div class="h-48 bg-gray-100 flex items-center justify-center">
          <img
            src="https://via.placeholder.com/400x200.png?text=เมนูอาหาร"
            alt="เมนูอาหาร"
            class="object-cover h-full w-full rounded-t-2xl"
          />
        </div>

        <!-- เนื้อหา -->
        <div class="p-6 flex flex-col justify-between flex-1 gap-4">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-3 py-1 text-xs font-medium bg-white/80 text-gray-700 rounded-full shadow-sm">
              📅 {{ item.day }}
            </span>
            <span class="inline-flex items-center px-3 py-1 text-xs font-medium bg-white/80 text-gray-700 rounded-full shadow-sm">
              🍱 {{ item.type }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ item.name }}
            </h2>
          </div>

          <div class="text-sm text-gray-700">
            คะแนน: <span class="font-medium text-yellow-600">{{ item.score ?? '-' }}</span>
          </div>

          <div class="flex gap-2">
            <button
              @click="likeMenu(item.name)"
              class="flex-1 py-2 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-sm"
            >
              ❤️ ถูกใจ / ยกเลิก
            </button>
            <button
              @click="openReview(item.name)"
              class="flex-1 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
            >
              📝 รีวิว
            </button>
          </div>

          <button class="mt-4 w-full py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
            ดูรายละเอียดเมนู
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 mt-10">
      ไม่มีเมนูที่สามารถทำได้ในสัปดาห์นี้
    </div>

    <!-- Modal รีวิว -->
    <div
      v-if="reviewingMenu"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 class="text-lg font-bold mb-4">📝 รีวิวเมนู: {{ reviewingMenu }}</h3>

        <label class="block mb-2">ให้คะแนน (1-5 ดาว)</label>
        <select v-model="reviewRating" class="w-full border p-2 rounded mb-3">
          <option v-for="n in 5" :key="n" :value="n">{{ n }} ดาว</option>
        </select>

        <label class="block mb-2">ความคิดเห็น</label>
        <textarea
          v-model="reviewComment"
          class="w-full border p-2 rounded mb-3"
          rows="3"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button
            class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            @click="cancelReview"
          >
            ❌ ยกเลิก
          </button>
          <button
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            @click="saveReview"
          >
            ✅ บันทึก
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ใช้ Tailwind CSS */
</style>
