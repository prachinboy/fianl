<template> 
  <div class="dashboard-container">
    <div class="welcome-box" v-if="user">

      <img :src="avatarUrl" class="avatar-img" alt="Avatar" />

      <h1>ยินดีต้อนรับ {{ displayName || user.username }}</h1>
      <p>ข้อมูลสรุปของคุณ: </p>
      <ul>
        <li>ชื่อผู้ใช้: {{ displayName || user.username }}</li>
        <li>อีเมล: {{ user.email }}</li>
        <li>จำนวนการใช้: {{ user.workouts }} ครั้ง</li>
      </ul>

      <button @click="goToMenu" class="menu-button">ไปหน้าเลือกเมนู</button>
      <button @click="goToSettings" class="settings-button">⚙️ ตั้งค่า</button>
      <button @click="logout" class="logout-button">ออกจากระบบ</button>
    </div>

    <div v-else class="fallback-text">
      <p>กำลังโหลดข้อมูลผู้ใช้...</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || 'null')
const displayName = ref('')
const avatarUrl = ref('')

if (!user) {
  router.push('/login')
} else {
  const fetchUserProfile = async () => {
    const userDoc = await getDoc(doc(db, 'users', user.email))
    if (userDoc.exists()) {
      const data = userDoc.data()
      displayName.value = data.displayName || ''
      avatarUrl.value = data.avatarUrl || ''
    }
  }
  fetchUserProfile()
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}

const goToMenu = () => {
  router.push('/menu-selection')
}

const goToSettings = () => {
  router.push('/settings')
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
  text-align: center;
}

.avatar-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 1rem;
  border: 2px solid red;
  background-color: yellow;
}

/* ✅ ทำให้ข้อความชิดจุด bullet มากขึ้น */
ul {
  padding-left: 1.2rem;
  margin: 0 auto;
  text-align: left;
  list-style-position: inside;
}

li {
  margin-bottom: 0.4rem;
}

.fallback-text {
  color: #666;
  font-size: 1.2rem;
}

h1 {
  margin-bottom: 1.5rem;
}

.logout-button,
.menu-button,
.settings-button {
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

.settings-button {
  background-color: #2196f3;
  color: white;
}

.settings-button:hover {
  background-color: #1976d2;
}
</style>
