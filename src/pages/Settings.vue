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

      <!-- ✅ เปลี่ยนรหัสผ่าน -->
      <div class="mb-6">
        <label class="block text-gray-700 font-semibold mb-1">🔒 เปลี่ยนรหัสผ่าน:</label>
        <input
          v-model="newPassword"
          type="password"
          placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          @click="updatePasswordHandler"
          class="w-full mt-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl shadow transition"
        >
          🔑 เปลี่ยนรหัสผ่าน
        </button>
        <p v-if="passwordMessage" :class="isPasswordSuccess ? 'text-green-600' : 'text-red-600'" class="mt-1">
          {{ passwordMessage }}
        </p>
      </div>

      <!-- บันทึก -->
      <button @click="saveProfile" class="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-xl shadow transition">
        💾 บันทึกข้อมูลโปรไฟล์
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged, updatePassword } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')
const userEmail = ref('')

// ✅ เปลี่ยนรหัสผ่าน
const newPassword = ref('')
const passwordMessage = ref('')
const isPasswordSuccess = ref(false)

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userEmail.value = user.email
      const userDoc = await getDoc(doc(db, 'users', user.uid))
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
    await setDoc(doc(db, 'users', user.uid), {
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

// ✅ ฟังก์ชันเปลี่ยนรหัสผ่าน
const updatePasswordHandler = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    passwordMessage.value = "❌ กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร"
    isPasswordSuccess.value = false
    return
  }

  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    passwordMessage.value = "❌ กรุณาเข้าสู่ระบบก่อน"
    isPasswordSuccess.value = false
    return
  }

  try {
    await updatePassword(user, newPassword.value)
    passwordMessage.value = "✅ เปลี่ยนรหัสผ่านสำเร็จ!"
    isPasswordSuccess.value = true
    newPassword.value = ''
  } catch (err) {
    console.error("❌ Error updating password:", err)
    passwordMessage.value = "❌ เกิดข้อผิดพลาด: " + err.message
    isPasswordSuccess.value = false
  }
}
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
