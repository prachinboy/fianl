<template>
  <div v-if="isAdmin" class="add-menu-container">
    <h2>เพิ่มเมนูอาหารใหม่</h2>
    <form @submit.prevent="submitMenu">
      <input v-model="name" type="text" placeholder="ชื่อเมนู" required />
      <textarea v-model="ingredients" placeholder="วัตถุดิบ (คั่นด้วย ,)" required></textarea>
      <textarea v-model="method" placeholder="วิธีทำ" required></textarea>
      <input v-model.number="calories" type="number" placeholder="แคลอรี่" required />
      <button type="submit">บันทึกเมนู</button>
    </form>
  </div>
  <div v-else class="unauthorized">
    <p>⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAdminRole } from '@/utils/useAdminRole.js'
const name = ref('')
const ingredients = ref('')
const method = ref('')
const calories = ref('')
const { isAdmin } = useAdminRole()

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        isAdmin.value = true
      }
    }
  })
})

const submitMenu = async () => {
  await addDoc(collection(db, 'recipes'), {
    name: name.value,
    ingredients: ingredients.value.split(',').map(i => i.trim()),
    method: method.value,
    calories: Number(calories.value),
    createdAt: serverTimestamp()
  })

  alert('✅ เพิ่มเมนูเรียบร้อย')
  name.value = ''
  ingredients.value = ''
  method.value = ''
  calories.value = ''
}
</script>

<style scoped>
.add-menu-container {
  max-width: 600px;
  margin: 2rem auto;
  background: #fff;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

h2 {
  color: #6c63ff;
  margin-bottom: 1rem;
}

input,
textarea {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

button {
  background-color: #6c63ff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.unauthorized {
  text-align: center;
  color: red;
  margin-top: 2rem;
  font-size: 1.1rem;
  font-weight: bold;
}
</style>