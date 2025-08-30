<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-200 via-white to-purple-200 px-4">
    <div class="bg-gradient-to-br from-indigo-100 via-white to-pink-100 rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">

      <!-- Illustration Side -->
      <div class="hidden md:flex items-center justify-center w-full md:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-500 p-8">
        <img src="https://cdn-icons-png.flaticon.com/512/3075/3075977.png" alt="signup" class="w-3/4 max-w-xs" />
      </div>

      <!-- Form Side -->
      <div class="w-full md:w-1/2 p-8">
        <div class="text-right text-sm mb-2">
          <span class="text-gray-500">มีบัญชีอยู่แล้ว?</span>
          <router-link to="/login" class="ml-2 px-3 py-1 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition">
            เข้าสู่ระบบ
          </router-link>
        </div>

        <h2 class="text-2xl font-bold text-indigo-800 mb-1">ยินดีต้อนรับ!</h2>
        <p class="text-sm text-gray-500 mb-6">สมัครสมาชิกเพื่อเริ่มต้นใช้งาน</p>

        <form @submit.prevent="register" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">ชื่อผู้ใช้</label>
            <input v-model="username" type="text" placeholder="กรอกชื่อผู้ใช้" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
            <input v-model="email" type="email" placeholder="กรอกอีเมล" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
            <input v-model="password" type="password" placeholder="กรอกรหัสผ่าน" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 rounded-lg shadow-md transition">
            สมัครสมาชิก
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')


const register = async () => {
  const auth = getAuth()
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // ✅ อัปเดต Firebase Auth (ไม่ใส่ photoURL)
    await updateProfile(user, {
      displayName: username.value
    })

    // ✅ บันทึกลง Firestore โดยไม่ใส่ avatar
    await setDoc(doc(db, 'users', user.uid), {
      displayName: username.value,
      email: email.value,
      avatar: '', // หรือ default path เช่น "profile-avatars/default.png"
      role: 'user',
      isAdmin: false
    })

    alert('✅ สมัครเรียบร้อย')
    router.push('/dashboard')
  } catch (err) {
    alert('❌ มี email, password หรือ username ซ้ำ สมัครใหม่นะ')
  }
}

</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
