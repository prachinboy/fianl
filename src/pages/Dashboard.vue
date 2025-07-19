<template>
  <div class="min-h-screen bg-gradient-to-tr from-indigo-100 via-white to-pink-100 flex">
    <!-- Sidebar -->
    <aside class="hidden md:flex flex-col w-64 bg-gradient-to-b from-indigo-600 to-indigo-500 text-white py-10 px-6 shadow-lg justify-between">
      <div>
        <div class="flex flex-col items-center gap-3">
          <img :src="avatarUrl" class="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" alt="Avatar" />
          <div class="text-center">
            <h2 class="text-lg font-semibold">{{ displayName || user.displayName }}</h2>
            <p class="text-xs opacity-80">👤 ผู้ใช้งานระบบ</p>
          </div>
        </div>

        <div class="mt-10 space-y-3 text-sm">
          <button @click="goToSettings" class="w-full text-left px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded">⚙️ ตั้งค่าโปรไฟล์</button>
          <button @click="goToMenu" class="w-full text-left px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded">📅 เลือกการแนะนำ</button>
          <button @click="goToHistory" class="w-full text-left px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded">🕓 ประวัติการแนะนำ</button>

          <button
            v-if="isAdmin"
            @click="goToAdmin"
            class="w-full text-left px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded"
          >
            🛠 จัดการระบบ
          </button>

          <button @click="logout" class="w-full text-left px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-sm">🚪 ออกจากระบบ</button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 py-12 px-6 max-w-6xl mx-auto">
      <div class="text-3xl font-extrabold text-orange-500 mb-6 text-center">
        FoodReco
      </div>

      <div class="bg-white rounded-3xl shadow-xl p-8">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">ยินดีต้อนรับ {{ displayName || user.displayName }}</h1>
          <p class="text-sm text-gray-500">📧 {{ user.email }}</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-6">
          <!-- ❤️ เมนูที่คุณเคยกดถูกใจ -->
          <div class="bg-gradient-to-br from-pink-100 to-indigo-100 p-6 rounded-xl shadow">
            <h2 class="font-semibold text-gray-800 mb-4">❤️ เมนูที่คุณเคยกดถูกใจ</h2>
            <div class="h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
              <ul v-if="likedDishes.length > 0" class="space-y-2 text-sm text-gray-700">
                <li
                  v-for="(dish, index) in likedDishes.slice().reverse()"
                  :key="index"
                  class="p-3 border rounded-md bg-pink-50 hover:bg-pink-100"
                >
                  ✅ {{ dish }}
                </li>
              </ul>
              <p v-else class="text-gray-400 text-sm">ยังไม่มีเมนูที่กดถูกใจ</p>
            </div>
          </div>

          <!-- 📝 รีวิวล่าสุด -->
          <div class="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl shadow">
            <h2 class="font-semibold text-gray-800 mb-4">📝 รีวิวล่าสุดของคุณ</h2>
            <div class="h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
              <ul class="text-sm space-y-2 text-gray-700">
                <li v-for="(review, index) in reviews.slice().reverse()" :key="index">
                  💬 {{ review }}
                </li>
                <li v-if="reviews.length === 0" class="text-gray-400">คุณยังไม่ได้รีวิวเมนูใดเลย</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || 'null')
const displayName = ref('')
const avatarUrl = ref('')
const likedDishes = ref([])
const reviews = ref([])

const isAdmin = user?.email === 'athipkusri@gmail.com'

if (!user) {
  router.push('/login')
} else {
  const fetchUserProfile = async () => {
    try {
      const userDocId = user.uid || user.email
      const userRef = doc(db, 'users', userDocId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        displayName.value = data.displayName || ''
        avatarUrl.value = data.avatarUrl || ''
        likedDishes.value = data.liked_dishes || []
        reviews.value = data.reviews || []
      }
    } catch (err) {
      console.error("❌ Error fetching user profile:", err.message)
    }
  }
  fetchUserProfile()
}

const goToMenu = () => router.push('/menu-selection')
const goToSettings = () => router.push('/settings')
const goToHistory = () => router.push('/history')
const goToAdmin = () => router.push('/admin')
const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(100, 100, 100, 0.5);
  border-radius: 10px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
</style>
