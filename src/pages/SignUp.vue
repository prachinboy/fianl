<template>
  <div class="signup-container">
    <div class="form-box">
      <h1>สมัครสมาชิก</h1>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>ชื่อผู้ใช้</label>
          <input v-model="username" type="text" placeholder="กรอกชื่อผู้ใช้" required />
        </div>
        <div class="form-group">
          <label>อีเมล</label>
          <input v-model="email" type="email" placeholder="กรอกอีเมล" required />
        </div>
        <div class="form-group">
          <label>รหัสผ่าน</label>
          <input v-model="password" type="password" placeholder="กรอกรหัสผ่าน" required />
        </div>
        <button type="submit" class="signup-button">สมัครสมาชิก</button>
      </form>
      <p class="login-link">
        มีบัญชีอยู่แล้ว? <router-link to="/login">เข้าสู่ระบบ</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const username = ref('')
const email = ref('')
const password = ref('')
const toast = useToast()
const router = useRouter()

const handleSubmit = async () => {
  try {
    const user = {
      username: username.value,
      email: email.value,
      password: password.value
    }

    localStorage.setItem('user', JSON.stringify(user))

    toast.success('สมัครสมาชิกสำเร็จ! 🎉')
    router.push('/login')
  } catch (error) {
    console.error(error)
    toast.error('สมัครไม่สำเร็จ ลองใหม่อีกครั้ง ❌')
  }
}
</script>

<style scoped>
.signup-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #c3ecf5, #f5c3e7);
}

.form-box {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.2rem;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: bold;
  color: #555;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.4rem;
}

.signup-button {
  width: 100%;
  padding: 0.7rem;
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.signup-button:hover {
  background-color: #5548c8;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
}

.login-link a {
  color: #6c63ff;
  text-decoration: underline;
}
</style>
