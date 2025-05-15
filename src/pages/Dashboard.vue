<template>
  <div class="dashboard-container">
    <div class="welcome-box">
      <h1>ยินดีต้อนรับไอสัสนรก</h1>
      <p>ข้อมูลสรุปของคุณ: </p>
      <ul>
        <li>ชื่อผู้ใช้: {{ user.username }}</li>
        <li>อีเมล: {{ user.email }}</li>
        <li>จำนวนการออกกำลังกาย: {{ user.workouts }} ครั้ง</li>
      </ul>
      <button @click="logout" class="logout-button">ออกจากระบบ</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

// ใช้ router สำหรับนำทางไปยังหน้า login หลังจาก logout
const router = useRouter()

// ฟังก์ชัน logout สำหรับการออกจากระบบ
const logout = () => {
  localStorage.removeItem('user')  // ลบข้อมูลผู้ใช้จาก localStorage
  router.push('/login')  // ไปที่หน้า Login
}

// ตรวจสอบว่า user มีการเข้าสู่ระบบแล้วหรือยัง
const user = JSON.parse(localStorage.getItem('user'))
if (!user) {
  // ถ้ายังไม่ได้เข้าสู่ระบบ ให้ไปที่หน้า Login
  router.push('/login')
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

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logout-button {
  width: 100%;
  padding: 0.7rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-button:hover {
  background-color: #d32f2f;
}
</style>
