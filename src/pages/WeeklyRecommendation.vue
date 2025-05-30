<template>
    <div class="weekly-recommendation-container">
      <h1>แนะนำเมนูอาหารรายสัปดาห์</h1>

      <!-- ช่องให้เลือกประเภทเนื้อสัตว์ -->
      <div class="selection-box">
        <label>เลือกเนื้อสัตว์ที่ชอบ</label>
        <multiselect
          v-model="selectedMeats"
          :options="meatOptions"
          :multiple="true"
          placeholder="เลือกเนื้อสัตว์"
          label="name"
          track-by="name"
          class="custom-select"
          :close-on-select="false"
        />
      </div>

      <!-- ช่องให้เลือกผัก -->
      <div class="selection-box">
        <label>เลือกผักที่ชอบ</label>
        <multiselect
          v-model="selectedVeggies"
          :options="veggieOptions"
          :multiple="true"
          placeholder="เลือกผัก"
          label="name"
          track-by="name"
          class="custom-select"
          :close-on-select="false"
        />
      </div>

      <!-- ช่องให้เลือกประเภทการทำอาหาร -->
      <div class="selection-box">
        <label>เลือกประเภทการทำอาหาร</label>
        <multiselect
          v-model="selectedCookingMethods"
          :options="cookingMethods"
          :multiple="true"
          placeholder="เลือกประเภทการทำอาหาร"
          label="name"
          track-by="name"
          class="custom-select"
          :close-on-select="false"
        />
      </div>

      <!-- ช่องกรอกชื่อเมนูที่ชอบ -->
      <div class="input-box">
        <label>กรอกชื่อเมนูที่ชอบ</label>
        <input v-model="favoriteDish" type="text" placeholder="กรอกชื่อเมนูที่ชอบ" />
      </div>

      <!-- ปุ่มส่งข้อมูล -->
      <button @click="handleSubmit">ตกลง</button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Multiselect from 'vue-multiselect'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'
import recipes from '@/data/recipes.json'
import { recommendMenus } from '@/utils/recommend'
import {
  fetchLogs,
  transformToTransactions,
  runApriori,
  suggestFromApriori
} from '@/utils/apriori'

const selectedMeats = ref([])
const selectedVeggies = ref([])
const selectedCookingMethods = ref([])
const favoriteDish = ref('')
const router = useRouter()

const meatOptions = [
  { name: 'ไก่' },
  { name: 'หมู' },
  { name: 'เนื้อ' }
]

const veggieOptions = [
  { name: 'ผักกาด' },
  { name: 'แครอท' },
  { name: 'บร็อคโคลี่' }
]

const cookingMethods = [
  { name: 'ต้ม' },
  { name: 'ทอด' },
  { name: 'ปิ้ง' }
]

const handleSubmit = async () => {
  const auth = getAuth()
  const user = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })

  if (!user) {
    alert('กรุณาเข้าสู่ระบบ')
    return
  }

  const userProfile = {
    preferred_meats: selectedMeats.value.map(m => m.name),
    preferred_veggies: selectedVeggies.value.map(v => v.name),
    preferred_methods: selectedCookingMethods.value.map(c => c.name),
    preferred_spices: [],
    liked_dishes: [favoriteDish.value],
    disliked_dishes: []
  }

  const logs = await fetchLogs()
  const transactions = transformToTransactions(logs)
  const rules = await runApriori(transactions)
  console.log('🔥 Apriori rules:', rules)
  const aprioriSuggestions = suggestFromApriori(userProfile.liked_dishes, rules)

  const resultData = recommendMenus(userProfile, recipes, logs)
  resultData.forEach(menu => {
    if (aprioriSuggestions.includes(menu.name)) {
      menu.score += 1.5
    }
  })

  const final7 = resultData.sort((a, b) => b.score - a.score).slice(0, 7)

  router.push({
    path: '/menu-results',
    query: { result: JSON.stringify(final7) }
  })
}
</script>

<style scoped>
.weekly-recommendation-container {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  background: #f4f7ff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #6c63ff;
  font-size: 2rem;
  font-weight: 600;
}

.selection-box {
  margin-bottom: 2rem;
}

.selection-box label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.custom-select {
  width: 100%;
  background-color: #ffffff;
  border: 2px solid #ddd;
  border-radius: 10px;
  padding: 0.75rem;
}

.input-box {
  margin-bottom: 2rem;
}

.input-box label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 1rem;
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #5548c8;
}
</style>
