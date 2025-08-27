<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-100 via-white to-indigo-200 px-4">
    <div class="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row">

      <!-- Illustration Side -->
      <div class="hidden md:flex items-center justify-center w-full md:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-500 p-8">
        <img src="https://cdn-icons-png.flaticon.com/512/1046/1046857.png" alt="login" class="w-3/4 max-w-xs" />
      </div>

      <!-- Form Side -->
      <div class="w-full md:w-1/2 p-8">
        <div class="text-right text-sm mb-2">
          <span class="text-gray-500">ยังไม่มีบัญชี?</span>
          <button @click.prevent="goToSignup" class="ml-2 px-3 py-1 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition">
            สมัครสมาชิก
          </button>
        </div>

        <h2 class="text-2xl font-bold text-indigo-800 mb-1">เข้าสู่ระบบ</h2>
        <p class="text-sm text-gray-500 mb-6">กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ</p>

        <form @submit.prevent="loginUser" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
            <input v-model="email" type="email" placeholder="อีเมล" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
            <input v-model="password" type="password" placeholder="รหัสผ่าน" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <button type="submit" class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 rounded-lg shadow-md transition">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

const email = ref('')
const password = ref('')
const router = useRouter()

const loginUser = async () => {
  try {
    const auth = getAuth()
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    // 🔍 ดึงข้อมูลจาก Firestore
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)

    // ❌ กรณี: ไม่พบข้อมูลใน Firestore (อาจถูกลบโดยแอดมิน)
    if (!snap.exists()) {
      alert('❌ บัญชีนี้ถูกลบออกจากระบบแล้ว')
      await auth.signOut()
      return
    }

    const data = snap.data()

    // ❌ กรณี: ถูกระงับการใช้งาน
    if (data.status === 'inactive' || data.active === false) {
      alert('❌ บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
      await auth.signOut()
      return
    }

    // ✅ เก็บข้อมูล user ลง localStorage
    localStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0]
    }))

    alert('✅ เข้าสู่ระบบสำเร็จ')
    router.push('/dashboard')

  } catch (error) {
    alert('❌ เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
  }
}

const goToSignup = () => {
  if (router.currentRoute.value.path !== '/signup') {
    router.replace({ path: '/signup' })
  }
}
</script>


<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
