<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 py-8 px-4">
    <div class="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-6">
      <h2 class="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
        <span>⚙️</span> ตั้งค่าผู้ใช้
      </h2>

      <!-- ชื่อที่แสดง -->
      <div class="mb-4">
        <label class="block text-gray-700 font-semibold mb-1">ชื่อที่แสดง:</label>
        <input v-model="displayName" type="text" placeholder="กรอกชื่อของคุณ..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      <!-- ✅ เปลี่ยนรหัสผ่าน -->
      <div class="mb-6">
        <label class="block text-gray-700 font-semibold mb-1">🔒 รหัสผ่านเดิม:</label>
        <input v-model="oldPassword" type="password" placeholder="กรอกรหัสผ่านเดิม" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />

        <label class="block text-gray-700 font-semibold mt-4 mb-1">🔒 รหัสผ่านใหม่:</label>
        <input v-model="newPassword" type="password" placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />

        <button @click="updatePasswordHandler" class="w-full mt-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl shadow transition">
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
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

const displayName = ref('')
const avatarUrl = ref('')
const userEmail = ref('')
const avatar = ref('')

const oldPassword = ref('')
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
        avatarUrl.value = data.avatarUrl || ''
      }
    }
  })
})

const updatePasswordHandler = async () => {
  if (!oldPassword.value || !newPassword.value || newPassword.value.length < 6) {
    passwordMessage.value = "❌ กรุณากรอกรหัสผ่านเดิม และรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
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
    const credential = EmailAuthProvider.credential(user.email, oldPassword.value)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword.value)

    passwordMessage.value = "✅ เปลี่ยนรหัสผ่านสำเร็จ!"
    isPasswordSuccess.value = true
    oldPassword.value = ''
    newPassword.value = ''
  } catch (err) {
    console.error("❌ Error updating password:", err)
    passwordMessage.value = "❌ เกิดข้อผิดพลาด: " + err.message
    isPasswordSuccess.value = false
  }
}

const saveProfile = async () => {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    console.log("❌ กรุณาเข้าสู่ระบบก่อน")
    return
  }

  try {
    await updateProfile(user, {
      displayName: displayName.value,
      photoURL: avatar.value
    })

    await setDoc(doc(db, 'users', user.uid), {
      displayName: displayName.value,
      avatar: avatar.value,
      email: userEmail.value,
      updatedAt: serverTimestamp()
    })

    passwordMessage.value = "✅ บันทึกข้อมูลสำเร็จ!"
    isPasswordSuccess.value = true
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err)
    passwordMessage.value = "❌ เกิดข้อผิดพลาด: " + err.message
    isPasswordSuccess.value = false
  }
}
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
