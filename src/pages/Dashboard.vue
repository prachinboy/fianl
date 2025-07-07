<template>
  <div class="min-h-screen bg-gradient-to-tr from-indigo-100 via-white to-pink-100 flex">
    <!-- Sidebar -->
    <aside class="hidden md:flex flex-col w-64 bg-gradient-to-b from-indigo-600 to-indigo-500 text-white py-10 px-6 shadow-lg justify-between">
      <div>
        <div class="flex flex-col items-center gap-3">
          <img :src="avatarUrl" class="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" alt="Avatar" />
          <div class="text-center">
            <h2 class="text-lg font-semibold">{{ displayName || user.username }}</h2>
            <p class="text-xs opacity-80">👤 ผู้ใช้งานระบบ</p>
          </div>
        </div>

        <div class="mt-10 space-y-3 text-sm">
          <button @click="goToSettings" class="w-full text-left px-3 py-2 bg-indigo-700 hover:bg-indigo-800 rounded">⚙️ ตั้งค่าโปรไฟล์</button>
          <button @click="goToMenu" class="w-full text-left px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded">📅 เลือกการแนะนำ</button>
          <button @click="goToHistory" class="w-full text-left px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded">🕓 ประวัติการแนะนำ</button>
          <button @click="logout" class="w-full text-left px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-sm">🚪 ออกจากระบบ</button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 py-12 px-6 max-w-6xl mx-auto">
      <div class="bg-white rounded-3xl shadow-xl p-8">
        <!-- Welcome Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">ยินดีต้อนรับ {{ displayName || user.username }}</h1>
          <p class="text-sm text-gray-500">📧 {{ user.email }}</p>
        </div>

        <!-- Chart + Reviews -->
        <div class="grid sm:grid-cols-2 gap-6">
          <!-- Pie Chart Placeholder -->
          <div class="bg-gradient-to-br from-pink-100 to-indigo-100 p-6 rounded-xl shadow text-center">
            <h2 class="font-semibold text-gray-800 mb-4">📊 หมวดหมู่เมนูที่คุณชอบ</h2>
            <div class="w-full h-40 bg-white rounded-full shadow-inner flex items-center justify-center text-gray-400">
              (แผนภูมิวง Placeholder)
            </div>
          </div>

          <!-- Review History -->
          <div class="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl shadow">
            <h2 class="font-semibold text-gray-800 mb-4">📝 รีวิวล่าสุดของคุณ</h2>
            <ul class="text-sm space-y-2 text-gray-700">
              <li v-for="(review, index) in reviews.slice(-3).reverse()" :key="index">
                💬 {{ review }}
              </li>
              <li v-if="reviews.length === 0" class="text-gray-400">คุณยังไม่ได้รีวิวเมนูใดเลย</li>
            </ul>
          </div>
        </div>

        <!-- Favorite Dishes Preview -->
        <div class="mt-10">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">❤️ เมนูที่คุณเคยกดถูกใจ</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(dish, index) in likedDishes.slice(-3).reverse()"
              :key="index"
              class="bg-white border border-gray-200 p-4 rounded-xl shadow hover:shadow-md"
            >
              <div class="text-sm text-gray-500 mb-1">🍽️ เมนูล่าสุดที่คุณกดถูกใจ</div>
              <div class="font-medium text-gray-800 truncate">{{ dish }}</div>
            </div>
            <div v-if="likedDishes.length === 0" class="text-gray-500 text-sm col-span-full">ยังไม่มีเมนูที่ถูกใจ</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || 'null')
const displayName = ref('')
const avatarUrl = ref('')
const likedDishes = ref([])
const reviews = ref([])

if (!user) {
  router.push('/login')
} else {
  const fetchUserProfile = async () => {
    const userDoc = await getDoc(doc(db, 'users', user.email))
    if (userDoc.exists()) {
      const data = userDoc.data()
      displayName.value = data.displayName || ''
      avatarUrl.value = data.avatarUrl || ''
      likedDishes.value = data.liked_dishes || []
      reviews.value = data.reviews || []
    }
  }
  fetchUserProfile()
}

const goToMenu = () => {
  router.push('/menu-selection')
}

const goToSettings = () => {
  router.push('/settings')
}

const goToHistory = () => {
  router.push('/history')
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>