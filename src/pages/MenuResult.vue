
<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, setDoc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import ReviewBox from '@/components/ReviewBox.vue'

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

const likeMenu = async (menuName) => {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนกดถูกใจเมนู')
    return
  }

  try {
    const userRef = doc(db, 'users', user.uid)

    // ✅ สร้าง document ถ้ายังไม่มี
    await setDoc(userRef, { liked_dishes: [] }, { merge: true })

    // ✅ เพิ่มเมนูที่ถูกใจใน users
    await updateDoc(userRef, {
      liked_dishes: arrayUnion(menuName)
    })

    // ✅ บันทึก log ใหม่ลง recommend_logs
    await addDoc(collection(db, 'recommend_logs'), {
      userId: user.uid,
      liked_dishes: [menuName],
      timestamp: serverTimestamp()
    })

    alert(`✅ คุณถูกใจเมนู: ${menuName}`)
  } catch (err) {
    console.error('❌ Error updating likes:', err.message)
    alert('เกิดข้อผิดพลาดในการกดถูกใจ')
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
            <button
              @click="likeMenu(item.name)"
              class="text-xl text-gray-400 hover:text-rose-500 transition-colors"
              title="ถูกใจเมนูนี้"
            >❤️</button>
          </div>

          <div class="text-sm text-gray-700">
            คะแนน: <span class="font-medium text-yellow-600">{{ item.score ?? '-' }}</span>
          </div>

          <ReviewBox :menuName="item.name" />

          <button class="mt-4 w-full py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
            ดูรายละเอียดเมนู
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 mt-10">
      ไม่มีเมนูที่สามารถทำได้ในสัปดาห์นี้
    </div>
  </div>
</template>

<style scoped>
/* ใช้ Tailwind CSS เต็มที่ */
</style>
