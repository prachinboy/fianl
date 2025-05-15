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
  
  const selectedMeats = ref([])
  const selectedVeggies = ref([])
  const selectedCookingMethods = ref([])
  const favoriteDish = ref('')
  
  const router = useRouter()
  
  // ตัวเลือกสำหรับประเภทเนื้อสัตว์
  const meatOptions = [
    { name: 'ไก่' },
    { name: 'หมู' },
    { name: 'เนื้อ' }
  ]
  
  // ตัวเลือกสำหรับผัก
  const veggieOptions = [
    { name: 'ผักกาด' },
    { name: 'แครอท' },
    { name: 'บร็อคโคลี่' }
  ]
  
  // ตัวเลือกสำหรับประเภทการทำอาหาร
  const cookingMethods = [
    { name: 'ต้ม' },
    { name: 'ทอด' },
    { name: 'ปิ้ง' }
  ]
  
  // ฟังก์ชันที่ใช้สำหรับการส่งข้อมูล
  const handleSubmit = () => {
    // แสดงข้อมูลที่ผู้ใช้เลือก
    console.log('เนื้อสัตว์ที่เลือก:', selectedMeats.value)
    console.log('ผักที่เลือก:', selectedVeggies.value)
    console.log('ประเภทการทำอาหารที่เลือก:', selectedCookingMethods.value)
    console.log('ชื่อเมนูที่ชอบ:', favoriteDish.value)
  
    // ส่งข้อมูลไปยังหน้าแสดงเมนูอาหาร
    router.push('/menu-results') // เปลี่ยนไปที่หน้าแสดงเมนูอาหารที่สามารถทำได้
  }
  </script>
  
  <style scoped>
  /* ตกแต่ง CSS */
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
  