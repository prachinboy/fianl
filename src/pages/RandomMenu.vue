<template>
  <div class="random-menu-container">
    <h1>สุ่มเมนูอาหาร</h1>
    <button @click="generateRandomMenu" class="random-button">สุ่มเมนู</button>
    <div v-if="randomMenu" class="menu-display">
      <h2>เมนูที่สุ่มได้: {{ randomMenu.name }}</h2>
      <p>{{ randomMenu.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// ตัวแปรเก็บเมนูที่สามารถสุ่มได้
const menus = [
  { name: 'ผัดไทย', description: 'ผัดไทยเส้นหมี่ ทอดกับไข่และเนื้อสัตว์' },
  { name: 'ข้าวผัด', description: 'ข้าวผัดใส่ไข่และผักตามชอบ' },
  { name: 'ส้มตำ', description: 'ส้มตำไทยพร้อมข้าวเหนียว' },
  { name: 'ต้มยำกุ้ง', description: 'ต้มยำกุ้งรสจัดพร้อมสมุนไพร' },
  { name: 'แกงเขียวหวาน', description: 'แกงเขียวหวานไก่พร้อมข้าวสวย' }
]

const randomMenu = ref(null)

// ฟังก์ชันสุ่มเมนู
const generateRandomMenu = () => {
  const randomIndex = Math.floor(Math.random() * menus.length)
  randomMenu.value = menus[randomIndex]
}
</script>

<style scoped>
.random-menu-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: #f4f7ff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #6c63ff;
  font-size: 2rem;
  font-weight: 600;
}

.random-button {
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

.random-button:hover {
  background-color: #5548c8;
}

.menu-display {
  margin-top: 2rem;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1);
}

.menu-display h2 {
  font-size: 1.5rem;
  color: #333;
}

.menu-display p {
  color: #777;
}
</style>
