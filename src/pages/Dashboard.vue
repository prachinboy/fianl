<template>
  <div class="dashboard-container">
    <div class="welcome-box" v-if="user">
      <h1>ยินดีต้อนรับ {{ user.username }}</h1>
      <p>ข้อมูลสรุปของคุณ: </p>
      <ul>
        <li>ชื่อผู้ใช้: {{ user.username }}</li>
        <li>อีเมล: {{ user.email }}</li>
        <li>จำนวนการใช้: {{ user.workouts }} ครั้ง</li>
      </ul>

      <button @click="goToMenu" class="menu-button">ไปหน้าเลือกเมนู</button>
      <button @click="logout" class="logout-button">ออกจากระบบ</button>
    </div>
    <div v-else class="fallback-text">
      <p>กำลังโหลดข้อมูลผู้ใช้...</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || 'null')

console.log('📦 user in Dashboard:', user)

if (!user) {
  router.push('/login')
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

const goToMenu = () => {
  router.push('/menu-selection')
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #c3ecf5, #f5c3e7);
}

.welcome-box {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.fallback-text {
  color: #666;
  font-size: 1.2rem;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logout-button,
.menu-button {
  width: 100%;
  padding: 0.7rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s ease;
}

.logout-button {
  background-color: #f44336;
  color: white;
}

.logout-button:hover {
  background-color: #d32f2f;
}

.menu-button {
  background-color: #6c63ff;
  color: white;
}

.menu-button:hover {
  background-color: #5146d8;
}
</style>
