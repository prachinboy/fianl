<template>
  <div class="weekly-recommendation-container">
    <h1>🍳 แนะนำอาหารรายวัน</h1>

    <div class="selection-box">
      <label>เลือกเนื้อสัตว์ที่ชอบ</label>
      <multiselect
        v-model="selectedMeats"
        :options="meatOptions"
        :multiple="true"
        label="name"
        track-by="name"
        class="custom-select"
        :close-on-select="false"
        placeholder="เลือกเนื้อสัตว์"
      />
    </div>

    <div class="selection-box">
      <label>เลือกผักที่ชอบ</label>
      <multiselect
        v-model="selectedVeggies"
        :options="veggieOptions"
        :multiple="true"
        label="name"
        track-by="name"
        class="custom-select"
        :close-on-select="false"
        placeholder="เลือกผัก"
      />
    </div>

    <div class="selection-box">
      <label>เลือกเครื่องเทศ</label>
      <multiselect
        v-model="selectedSpices"
        :options="combinedSpices"
        :multiple="true"
        label="name"
        track-by="name"
        class="custom-select"
        :close-on-select="false"
        placeholder="เครื่องเทศ"
      />
    </div>

    <div class="selection-box">
      <label>เลือกวิธีปรุง</label>
      <multiselect
        v-model="selectedTypes"
        :options="typeOptions"
        :multiple="true"
        label="name"
        track-by="name"
        class="custom-select"
        :close-on-select="false"
        placeholder="เลือกวิธีปรุง"
      />
    </div>

    <button @click="handleSubmit">ตกลง</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
const favoriteDish = ref('')
const router = useRouter()

// ✅ คัดลอกจาก WeeklyRecommendation.vue
const meatOptions = [
  { name: 'ไก่' }, { name: 'หมู' }, { name: 'เนื้อ' }, { name: 'เป็ด' }, { name: 'กุ้ง' },
  { name: 'ปลา' }, { name: 'หมึก' }, { name: 'หมูยอ' }, { name: 'บะหมี่' }, { name: 'หมูแดง' },
  { name: 'หมี่' }, { name: 'เต้าหู้ไข่' }, { name: 'ขนมจีน' }, { name: 'เส้นเล็ก' }, { name: 'ตับ' },
  { name: 'เม็ดมะม่วงหิมมะพานต์' }, { name: 'หมูกรอบ' }, { name: 'เต้าหู้' }, { name: 'ลูกชิ้นปลา' },
  { name: 'กระดูกหมู' }, { name: 'หมูสามชั้น' }, { name: 'ซี่โครงหมู' }, { name: 'ไส้หมู' },
  { name: 'หมูป่า' }, { name: 'หมูสับ' }, { name: 'เนื้อสับ' }, { name: 'กุ้งแห้ง' }
]

const veggieOptions = [
  { name: 'ผักกาด' }, { name: 'แครอท' }, { name: 'บร็อคโคลี่' }, { name: 'เห็ด' },
  { name: 'ฟักทอง' }, { name: 'บวบ' }, { name: 'ถั่วฝักยาว' }, { name: 'ผักบุ้ง' },
  { name: 'มะขือ' }, { name: 'หน่อไม้' }, { name: 'ยอดชะอม' }, { name: 'กวางตุ้ง' },
  { name: 'มะละกอ' }, { name: 'มะเขือเทศ' }, { name: 'แตงกวา' }, { name: 'ผักหวาน' },
  { name: 'มะระ' }, { name: 'ถั่วงอก' }, { name: 'ผักกาดดอง' }, { name: 'ตำลึง' },
  { name: 'ฟัก' }, { name: 'มันฝรั่ง' }, { name: 'กระหล่ำปี' }, { name: 'ใบชะพลู' },
  { name: 'พริก' }, { name: 'กระเทียม' }, { name: 'ขิง' }, { name: 'ตะไคร้' },
  { name: 'ใบมะกรูด' }, { name: 'ข่า' }, { name: 'รากผักชี' }, { name: 'พริกไทยดำ' },
  { name: 'หอมแดง' }, { name: 'กะทิ' }, { name: 'ขมิ้น' }, { name: 'มะกรูด' },
  { name: 'ใบโหระพา' }, { name: 'ใบแมงลัก' }, { name: 'เม็ดผักชี' }, { name: 'ผักชีฝรั่ง' },
  { name: 'มะนาว' }, { name: 'ต้นหอม' }, { name: 'ใบกะเพรา' }, { name: 'พริกไทย' },
  { name: 'กระเททียมเจียว' }, { name: 'หอมใหญ่' }, { name: 'ขมิ้น' }, { name: 'พริกหยวก' }
]

const typeOptions = [
  { name: 'ต้ม' }, { name: 'ทอด' }, { name: 'ผัด' }, { name: 'แกง' }, { name: 'นึ่ง' },
  { name: 'ยำ' }, { name: 'อบ' }, { name: 'ปิ้ง' }, { name: 'ย่าง' }
]

const combinedSpices = [
  { name: 'น้ำปลา' }, { name: 'น้ำมันหอย' }, { name: 'พริกแกง' }, { name: 'พริกเผา' },
  { name: 'นมข้นจืด' }, { name: 'กะทิ' }, { name: 'เกลือ' }, { name: 'น้ำปลาร้า' },
  { name: 'ผงกระหรี่' }, { name: 'ไตปลา' }, { name: 'ซีอิ๊ว' }, { name: 'น้ำผึ้ง' },
  { name: 'ข้าวคั่ว' }, { name: 'น้ำมะขามเปียก' }
]

const handleSubmit = async () => {
  try {
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

    let hybridResults = await recommendHybrid(userInput, liked)
    hybridResults = hybridResults.slice(0, 3) // ✅ 3 เมนู: เช้า กลางวัน เย็น
    // ✅ เพิ่ม type: 'daily' เข้าไปในการบันทึก
    await addDoc(collection(db, 'recommend_logs'), {
      email: user.email,
      timestamp: serverTimestamp(),
      type: 'daily', // ✅ ตรงนี้สำคัญ
      resultData: hybridResults
    })

    router.push({ path: '/daily-menu-result', query: { result: JSON.stringify(hybridResults) } })
  } catch (err) {
    console.error('❌ Firestore error:', err)
    alert('เกิดข้อผิดพลาด: ' + err.message)
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
  min-height: 50px;
}

.custom-select .multiselect__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 100px; /* ✅ จำกัดความสูง */
  overflow-y: auto; /* ✅ เลื่อนแทนล้น */
  overflow-x: hidden;
}

.custom-select .multiselect__tag {
  margin: 0;
}

::v-deep(.multiselect__content-wrapper) {
  max-height: none !important;
  overflow-y: visible !important;
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
