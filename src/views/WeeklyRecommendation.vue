<template>
  <div class="weekly-recommendation-container">
    <h1>แนะนำเมนูอาหารรายสัปดาห์</h1>

    <div class="selection-box">
      <label>เลือกเนื้อสัตว์ที่ชอบ</label>
      <multiselect v-model="selectedMeats" :options="meatOptions" :multiple="true" label="name" track-by="name"
                   class="custom-select" :close-on-select="false" placeholder="เลือกเนื้อสัตว์" />
    </div>

    <div class="selection-box">
      <label>เลือกผักที่ชอบ</label>
      <multiselect v-model="selectedVeggies" :options="veggieOptions" :multiple="true" label="name" track-by="name"
                   class="custom-select" :close-on-select="false" placeholder="เลือกผัก" />
    </div>

    <div class="selection-box">
      <label>เลือกประเภทการทำอาหาร</label>
      <multiselect v-model="selectedCookingMethods" :options="cookingMethods" :multiple="true" label="name" track-by="name"
                   class="custom-select" :close-on-select="false" placeholder="เลือกประเภทการทำอาหาร" />
    </div>

    <div class="selection-box">
      <label>เลือกเครื่องเทศที่ชอบ</label>
      <multiselect v-model="selectedSpices" :options="spiceOptions" :multiple="true" label="name" track-by="name"
                   class="custom-select" :close-on-select="false" placeholder="เลือกเครื่องเทศ" />
    </div>

    <div class="input-box">
      <label>กรอกชื่อเมนูที่ชอบ</label>
      <input v-model="favoriteDish" type="text" placeholder="กรอกชื่อเมนูที่ชอบ" />
    </div>

    <button @click="handleSubmit">ตกลง</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Multiselect from 'vue-multiselect'
import { useRouter } from 'vue-router'
import recipes from '@/data/recipes.json'
import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { recommendMenus } from '@/utils/recommend'

const selectedMeats = ref([])
const selectedVeggies = ref([])
const selectedCookingMethods = ref([])
const selectedSpices = ref([])
const favoriteDish = ref('')
const router = useRouter()

const meatOptions = [
  { name: 'ไก่' }, { name: 'หมู' }, { name: 'เนื้อ' }, { name: 'เป็ด' },
  { name: 'กุ้ง' }, { name: 'ปลา' }, { name: 'หมึก' }, { name: 'ตับ' }
]

const veggieOptions = [
  { name: 'ผักกาด' }, { name: 'แครอท' }, { name: 'บร็อคโคลี่' }, { name: 'เห็ด' },
  { name: 'ฟักทอง' }, { name: 'บวบ' }, { name: 'ถั่วฝักยาว' }, { name: 'ผักบุ้ง' }
]

const cookingMethods = [
  { name: 'ต้ม' }, { name: 'ทอด' }, { name: 'ปิ้ง' }, { name: 'นึ่ง' },
  { name: 'ผัด' }, { name: 'อบ' }, { name: 'ย่าง' }, { name: 'ยำ' }
]

const spiceOptions = [
  { name: 'พริก' }, { name: 'กระเทียม' }, { name: 'ขิง' }, { name: 'ตะไคร้' },
  { name: 'ใบมะกรูด' }, { name: 'ข่า' }, { name: 'รากผักชี' }, { name: 'พริกไทยดำ' }
]

const handleSubmit = async () => {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    alert('❌ กรุณา login ก่อนทำรายการ')
    return
  }

  console.log("👤 currentUser:", user.uid, user.email)

  const userProfile = {
    preferred_meats: selectedMeats.value.map(m => m.name),
    preferred_veggies: selectedVeggies.value.map(v => v.name),
    preferred_methods: selectedCookingMethods.value.map(c => c.name),
    preferred_spices: selectedSpices.value.map(s => s.name),
    liked_dishes: [favoriteDish.value],
    disliked_dishes: []
  }

  const resultData = recommendMenus(userProfile, recipes, []) // ส่ง [] แทน logs เพราะไม่ได้ใช้ logs ตอนนี้
  const shuffled = [...resultData].sort(() => Math.random() - 0.5)
  const final7 = shuffled.slice(0, 7)

  try {
    console.log("🔥 ADDING TO Firestore:", {
      email: user.email,
      userProfile,
      resultData: final7
    })

    await addDoc(collection(db, 'recommend_logs'), {
      email: user.email,
      timestamp: serverTimestamp(),
      userProfile,
      resultData: final7
    })

    console.log('✅ เขียน log ลง firestore แล้ว')

    router.push({
      path: '/menu-result',
      query: {
        result: JSON.stringify(final7)
      }
    })
  } catch (err) {
    console.error('❌ Firestore error:', err.code, err.message)
    alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่')
  }
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
