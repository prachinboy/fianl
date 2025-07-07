<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 py-8 px-4">
    <div class="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-6">
      <h2 class="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
        <span>⚙️</span> ตั้งค่าผู้ใช้
      </h2>

      <!-- รูปโปรไฟล์ -->
      <div class="mb-6">
        <label class="block text-gray-700 font-semibold mb-2">📸 อัปโหลดรูปโปรไฟล์:</label>
        <input type="file" accept="image/*" @change="handleFileUpload" class="mb-3" />
        <div v-if="avatarUrl">
          <img :src="avatarUrl" alt="Avatar" class="w-24 h-24 rounded-full object-cover border-2 border-indigo-400 shadow" />
        </div>
      </div>

      <!-- ชื่อที่แสดง -->
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-1">ชื่อที่แสดง:</label>
        <input v-model="displayName" type="text" placeholder="กรอกชื่อของคุณ..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      <!-- bio -->
      <div class="mb-6">
        <label class="block text-gray-700 font-semibold mb-1">ข้อมูลเกี่ยวกับตัวคุณ (bio):</label>
        <textarea v-model="bio" placeholder="เช่น: ชอบทำอาหารคลีน..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"></textarea>
      </div>

      <!-- บันทึก -->
      <button @click="saveProfile" class="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-xl shadow transition mb-8">
        💾 บันทึกข้อมูลโปรไฟล์
      </button>

      <div class="grid sm:grid-cols-2 gap-4">
        <!-- ล้างหัวใจ -->
        <div class="bg-red-50 border border-red-200 p-4 rounded-xl shadow">
          <p class="text-red-600 font-semibold mb-2">🗑 ล้างเมนูที่คุณเคยกดหัวใจ</p>
          <button @click="clearLikedMenus" class="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">ล้าง ❤️ ทั้งหมด</button>
        </div>

        <!-- ธีม -->
        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow">
          <p class="text-yellow-700 font-semibold mb-2">🎨 ธีมปัจจุบัน: <strong>{{ theme }}</strong></p>
          <button @click="toggleTheme" class="w-full py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500">เปลี่ยนธีม</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const displayName = ref('')
const bio = ref('')
const theme = ref('light')
const avatarUrl = ref('')
const userEmail = ref('')

const applyTheme = () => {
  document.body.className = theme.value
}

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'light'
  applyTheme()

  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userEmail.value = user.email
      const userDoc = await getDoc(doc(db, 'users', user.email))
      if (userDoc.exists()) {
        const data = userDoc.data()
        displayName.value = data.displayName || ''
        bio.value = data.bio || ''
        avatarUrl.value = data.avatarUrl || ''
      }
    }
  })
})

const saveProfile = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) return alert('ยังไม่ได้ login')

  try {
    await setDoc(doc(db, 'users', user.email), {
      displayName: displayName.value,
      bio: bio.value,
      avatarUrl: avatarUrl.value,
      email: user.email,
      updatedAt: serverTimestamp()
    }, { merge: true })

    alert('✅ บันทึกข้อมูลโปรไฟล์เรียบร้อย')
  } catch (err) {
    alert('❌ เกิดข้อผิดพลาดในการบันทึก')
  }
}

const clearLikedMenus = () => {
  localStorage.removeItem('likedMenus')
  alert('🗑 ลบเมนูที่กด ❤️ แล้ว')
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  applyTheme()
  alert(`🌈 เปลี่ยนธีมเป็น ${theme.value}`)
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !userEmail.value) return

  const storage = getStorage()
  const storagePath = `avatars/${userEmail.value}`
  const fileRef = storageRef(storage, storagePath)

  await uploadBytes(fileRef, file)
  avatarUrl.value = await getDownloadURL(fileRef)
  alert('📸 รูปถูกอัปโหลดเรียบร้อย')
}
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
