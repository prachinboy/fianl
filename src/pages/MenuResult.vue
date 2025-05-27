<template>
  <div class="menu-results-container">
    <h1>เมนูอาหารที่คุณสามารถทำได้ (ในสัปดาห์นี้)</h1>

    <!-- ตารางแสดงผลเมนูอาหารรายสัปดาห์ -->
    <div v-if="menuItems.length">
      <table class="menu-table">
        <thead>
          <tr>
            <th>วัน</th>
            <th>เมนูอาหาร</th>
            <th>ประเภท</th>
            <th>คะแนน</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in menuItems" :key="index">
            <td>{{ item.day }}</td>
            <td>
              {{ item.name }}
              <button @click="likeMenu(item.name)" class="like-btn">❤️</button>
              <ReviewBox :menuName="item.name" />
            </td>
            <td>{{ item.type }}</td>
            <td>{{ item.score ?? '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>ไม่มีเมนูที่สามารถทำได้ในสัปดาห์นี้</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import ReviewBox from '@/components/ReviewBox.vue'

const route = useRoute()
const raw = route.query.result ? JSON.parse(route.query.result) : []

const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']

const shuffled = [...raw].sort(() => Math.random() - 0.5)

const menuItems = ref(days.map((day, index) => ({
  day,
  name: shuffled[index]?.name ?? '-',
  type: shuffled[index]?.type ?? '-',
  score: shuffled[index]?.score ?? '-'
})))

const likeMenu = async (menuName) => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนกดถูกใจเมนู')
    return
  }

  const userRef = doc(db, 'users', user.uid)
  await updateDoc(userRef, {
    liked_dishes: arrayUnion(menuName)
  })

  alert(`✅ คุณถูกใจเมนู: ${menuName}`)
}
</script>

<style scoped>
.menu-results-container {
  max-width: 900px;
  margin: 2rem auto;
  text-align: center;
  background: #f9f9f9;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2rem;
  color: #6c63ff;
  margin-bottom: 1.5rem;
}

.menu-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 auto;
  text-align: left;
}

.menu-table th,
.menu-table td {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.menu-table th {
  background-color: #6c63ff;
  color: white;
  font-weight: bold;
}

.menu-table tr:nth-child(even) {
  background-color: #f3f3f3;
}

.menu-table tr:nth-child(odd) {
  background-color: #fafafa;
}

.menu-table tr:hover {
  background-color: #f2f2f2;
}

.menu-table td {
  font-size: 1.1rem;
}

.menu-table td:nth-child(2) {
  font-weight: bold;
}

.like-btn {
  margin-left: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}
.like-btn:hover {
  color: #ff3e75;
}
</style>