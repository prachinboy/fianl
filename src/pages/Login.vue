<template>
  <div class="login-container">
    <h1>เข้าสู่ระบบ</h1>
    <form @submit.prevent="loginUser" class="login-form">
      <input v-model="email" type="email" placeholder="อีเมล" required />
      <input v-model="password" type="password" placeholder="รหัสผ่าน" required />
      <button type="submit">เข้าสู่ระบบ</button>
    </form>
    <p class="note">
      ยังไม่มีบัญชี?
      <a @click.prevent="goToSignup" href="#">สมัครสมาชิก</a>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

const email = ref('')
const password = ref('')
const router = useRouter()

const loginUser = async () => {
  try {
    const auth = getAuth()
    await signInWithEmailAndPassword(auth, email.value, password.value)

    const existing = JSON.parse(localStorage.getItem('user') || '{}')
    const newCount = (existing.workouts || 0) + 1

    localStorage.setItem('user', JSON.stringify({
      username: email.value.split('@')[0],
      email: email.value,
      workouts: newCount
    }))

    alert('✅ เข้าสู่ระบบสำเร็จ')
    router.push('/dashboard')
  } catch (error) {
    alert('❌ เข้าสู่ระบบไม่สำเร็จ: ' + error.message)
  }
}

// ✅ ไม่ลบ registerUser ตามคำขอเดิม
const registerUser = async () => {
  try {
    const auth = getAuth()
    await createUserWithEmailAndPassword(auth, email.value, password.value)

    localStorage.setItem('user', JSON.stringify({
      username: email.value.split('@')[0],
      email: email.value,
      workouts: 0
    }))

    alert('✅ สมัครสมาชิกสำเร็จ และเข้าสู่ระบบแล้ว')
    router.push('/dashboard')
  } catch (error) {
    alert('❌ สมัครไม่สำเร็จ: ' + error.message)
  }
}

// ✅ ฟังก์ชันเปลี่ยนหน้าแบบไม่ซ้อน hash
const goToSignup = () => {
  if (router.currentRoute.value.path !== '/signup') {
    router.replace({ path: '/signup' })
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 3rem auto;
  background: #f4f7ff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
}

.login-container h1 {
  color: #6c63ff;
  margin-bottom: 1.5rem;
}

.login-form input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.login-form button {
  width: 100%;
  padding: 0.75rem;
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.login-form button:hover {
  background-color: #5146d8;
}

.note {
  margin-top: 1rem;
}
</style>
