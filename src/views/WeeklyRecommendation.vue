<template>
  <div class="weekly-recommendation-container">
    <h1>แนะนำเมนูอาหารรายสัปดาห์</h1>

    <!-- กลุ่มวัตถุดิบ -->
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
      <label>เลือกประเภทเมนูอาหารที่ชอบ</label>
      <multiselect v-model="selectedTypes" :options="typeOptions" :multiple="true" label="name" track-by="name"
        class="custom-select" :close-on-select="false" placeholder="เลือกประเภทอาหาร" />
    </div>

    <div class="selection-box">
      <label>เลือกเครื่องเทศ/สมุนไพรไทยที่ชอบ</label>
      <multiselect v-model="selectedSpices" :options="combinedSpices" :multiple="true" label="name" track-by="name"
        class="custom-select" :close-on-select="false" placeholder="เลือกเครื่องเทศ" />
    </div>

    <div class="selection-box">
      <label>เลือกประเภทอาหารจาก API (Spoonacular)</label>
      <multiselect v-model="selectedCategories" :options="apiFoodCategories" :multiple="true" label="name" track-by="name"
        class="custom-select" :close-on-select="false" placeholder="เลือกประเภทอาหาร" />
    </div>

    <div class="input-box">
      <label>กรอกชื่อเมนูที่ชอบ</label>
      <input v-model="favoriteDish" type="text" placeholder="กรอกชื่อเมนูที่ชอบ" />
    </div>

    <button @click="handleSubmit">ตกลง</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Multiselect from 'vue-multiselect'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { recommendHybrid } from '@/utils/recommendHybrid'

const selectedMeats = ref([])
const selectedVeggies = ref([])
const selectedTypes = ref([])
const selectedSpices = ref([])
const selectedCategories = ref([])
const favoriteDish = ref('')
const apiFoodCategories = ref([])
const router = useRouter()

const meatOptions = [
  { name: 'ไก่' }, { name: 'หมู' }, { name: 'เนื้อ' }, { name: 'เป็ด' }, { name: 'กุ้ง' }, { name: 'ปลา' }, { name: 'หมึก' }, { name: 'ตับ' }
]
const veggieOptions = [
  { name: 'ผักกาด' }, { name: 'แครอท' }, { name: 'บร็อคโคลี่' }, { name: 'เห็ด' }, { name: 'ฟักทอง' }, { name: 'บวบ' }, { name: 'ถั่วฝักยาว' }, { name: 'ผักบุ้ง' }
]
const typeOptions = [
  { name: 'ต้ม' }, { name: 'ทอด' }, { name: 'ผัด' }, { name: 'แกง' }, { name: 'นึ่ง' }, { name: 'ยำ' }, { name: 'อบ' }, { name: 'ปิ้ง' },{ name: 'ย่าง' }
]
const combinedSpices = [
  { name: 'พริก' }, { name: 'กระเทียม' }, { name: 'ขิง' }, { name: 'ตะไคร้' }, { name: 'ใบมะกรูด' },
  { name: 'ข่า' }, { name: 'รากผักชี' }, { name: 'พริกไทยดำ' }, { name: 'หอมแดง' }, { name: 'กะปิ' },
  { name: 'ขมิ้น' }, { name: 'มะกรูด' }, { name: 'ใบโหระพา' }, { name: 'ใบแมงลัก' }, { name: 'เม็ดผักชี' }, { name: 'ยี่หร่า' }
]

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/food-categories')
    const data = await res.json()
    apiFoodCategories.value = data.map(name => ({ name }))
  } catch (err) {
    console.error('❌ ไม่สามารถโหลดประเภทอาหารจาก API ได้:', err)
  }
})

const handleSubmit = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert('❌ กรุณา login ก่อนทำรายการ')
    return
  }

  const docSnap = await getDoc(doc(db, 'users', user.uid))
  const liked = docSnap.exists() ? docSnap.data().liked_dishes || [] : []

  const userInput = {
    meats: selectedMeats.value.map(m => m.name),
    veggies: selectedVeggies.value.map(v => v.name),
    types: selectedTypes.value.map(t => t.name),
    favorite: favoriteDish.value
  }

  const hybridResults = await recommendHybrid(userInput, liked)

  const userProfile = {
    preferred_meats: userInput.meats,
    preferred_veggies: userInput.veggies,
    preferred_types: userInput.types,
    preferred_spices: selectedSpices.value.map(s => s.name),
    preferred_categories: selectedCategories.value.map(c => c.name),
    liked_dishes: [favoriteDish.value],
    disliked_dishes: []
  }

  try {
    await addDoc(collection(db, 'recommend_logs'), {
      email: user.email,
      timestamp: serverTimestamp(),
      userProfile,
      resultData: hybridResults
    })

    router.push({
      path: '/menu-result',
      query: { result: JSON.stringify(hybridResults) }
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
