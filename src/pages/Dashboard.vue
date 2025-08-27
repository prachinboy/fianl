<script setup>
import { useRouter } from 'vue-router'
import { ref, onUnmounted } from 'vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, doc, query, where, orderBy, limit, onSnapshot, deleteDoc, getDoc } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const router = useRouter()
const user = ref(null)
const displayName = ref('')
const avatarUrl = ref('')
const likedDishes = ref([])
const reviews = ref([])
const isAdmin = ref(false)
const userRole = ref('ผู้ใช้งานระบบ') // ✅ เพิ่มตัวแปรสถานะ
const loading = ref(true)

onAuthStateChanged(getAuth(), async (u) => {
  if (!u) {
    router.push('/login')
    return
  }

  user.value = u // ✅ ใช้ uid เพื่อความเสถียร
  const userRef = doc(db, 'users', u.uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const data = userSnap.data()
    displayName.value = data.displayName || ''
    avatarUrl.value = data.avatar || ''
    // ✅ ตรวจสอบ role / isAdmin และอัปเดตสถานะอัตโนมัติ
    const adminCheck = data.isAdmin === true || data.role === 'admin'
    isAdmin.value = adminCheck
    userRole.value = adminCheck ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานระบบ'
  }

  const likedQuery = query(
    collection(db, 'liked_dishes_logs'),
    where('email', '==', u.email)
  )

  const unsubLikes = onSnapshot(likedQuery, (snapshot) => {
    likedDishes.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().menuName
    }))
  })

  const reviewQuery = query(
    collection(db, 'reviews'),
    where('email', '==', u.email),
    orderBy('timestamp', 'desc'),
    limit(5)
  )

  const unsubReviews = onSnapshot(reviewQuery, (snapshot) => {
    reviews.value = snapshot.docs.map((doc) => {
      const d = doc.data()
      return `${d.menuName} (${d.rating}⭐): ${d.comment}`
    })
  })

  onUnmounted(() => {
    unsubLikes()
    unsubReviews()
  })

  loading.value = false
})

const deleteLikedDish = async (id) => {
  try {
    await deleteDoc(doc(db, 'liked_dishes_logs', id))
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการลบเมนู')
  }
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

<template>
  <div class="min-h-screen bg-gradient-to-tr from-indigo-100 via-white to-pink-100 flex">
    <aside class="hidden md:flex flex-col w-64 bg-gradient-to-b from-indigo-600 to-indigo-500 text-white py-10 px-6 shadow-lg justify-between">
      <div>
        <div class="flex flex-col items-center gap-3">
          <img :src="avatarUrl" class="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover" alt="Avatar" />
          <div class="text-center">
            <h2 class="text-lg font-semibold">{{ displayName || user?.displayName }}</h2>
            <p class="text-xs opacity-80">👤 {{ userRole }}</p>
          </div>
        </div>
        <div class="mt-10 space-y-3 text-sm">
          <button @click="goToSettings" class="w-full text-left px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded">⚙️ ตั้งค่าโปรไฟล์</button>
          <button @click="goToMenu" class="w-full text-left px-3 py-2 bg-pink-600 hover:bg-pink-700 rounded">📅 เลือกการแนะนำ</button>
          <button @click="goToHistory" class="w-full text-left px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded">🕓 ประวัติการแนะนำ</button>
          <!-- ✅ ปุ่มแอดมิน -->
          <button v-if="!loading && isAdmin" @click="goToAdmin" class="w-full text-left px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded"> 🛠 จัดการระบบ </button>
          <button @click="logout" class="w-full text-left px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-sm">🚪 ออกจากระบบ</button>
        </div>
      </div>
    </aside>

    <main class="flex-1 py-12 px-6 max-w-6xl mx-auto">
      <div class="text-3xl font-extrabold text-orange-500 mb-6 text-center">food is everything</div>
      <div class="bg-white rounded-3xl shadow-xl p-8">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">ยินดีต้อนรับ {{ displayName || user?.displayName }}</h1>
          <p class="text-sm text-gray-500">📧 {{ user?.email }}</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-6">
          <!-- ❤️ เมนูที่คุณเคยกดถูกใจ -->
          <div class="bg-gradient-to-br from-pink-100 to-indigo-100 p-6 rounded-xl shadow">
            <h2 class="font-semibold text-gray-800 mb-4">❤️ เมนูที่คุณเคยกดถูกใจ</h2>
            <div class="h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
              <ul v-if="likedDishes.length > 0" class="space-y-2 text-sm text-gray-700">
                <li v-for="dish in likedDishes" :key="dish.id" class="flex justify-between items-center p-3 border rounded-md bg-pink-50 hover:bg-pink-100">
                  ✅ {{ dish.name }}
                  <button @click="deleteLikedDish(dish.id)" class="text-red-500 hover:text-red-700 text-lg">❌</button>
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
                <li v-for="(review, index) in reviews" :key="index">💬 {{ review }}</li>
                <li v-if="reviews.length === 0" class="text-gray-400">คุณยังไม่ได้รีวิวเมนูใดเลย</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
