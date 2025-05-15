<template>
  <div class="login-container">
    <div class="form-box">
      <h1>เข้าสู่ระบบ</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>อีเมล</label>
          <input v-model="email" type="email" placeholder="กรอกอีเมล" required />
        </div>
        <div class="form-group">
          <label>รหัสผ่าน</label>
          <input v-model="password" type="password" placeholder="กรอกรหัสผ่าน" required />
        </div>
        <button type="submit" class="login-button">เข้าสู่ระบบ</button>
      </form>
      <p class="signup-link">
        ยังไม่มีบัญชี? <router-link to="/signup">สมัครสมาชิก</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const toast = useToast()
const router = useRouter()

const handleLogin = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user'))

    // ตรวจสอบข้อมูลผู้ใช้จาก localStorage
    if (storedUser && storedUser.email === email.value && storedUser.password === password.value) {
      toast.success('เข้าสู่ระบบสำเร็จ! 🎉')
      // เปลี่ยนให้ไปที่หน้าเลือกประเภทเมนู
      router.push('/menu-selection')
    } else {
      toast.error('ข้อมูลไม่ถูกต้อง ❌')
    }
  } catch (error) {
    console.error(error)
    toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ ❌')
  }
}
</script>

<style scoped>
.login-container {
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

.login-button {
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

.login-button:hover {
  background-color: #5548c8;
}

.signup-link {
  text-align: center;
  margin-top: 1rem;
}

.signup-link a {
  color: #6c63ff;
  text-decoration: underline;
}
</style>
