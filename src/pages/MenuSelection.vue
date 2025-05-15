<template>
  <div class="menu-selection-container">
    <div class="title-box">
      <h1>เลือกประเภทเมนูที่คุณชอบ</h1>
      <p>กรุณาเลือกประเภทเมนูหรือเมนูที่คุณต้องการแนะนำ</p>
    </div>

    <!-- ปุ่มสำหรับแนะนำเมนูรายสัปดาห์ -->
    <div class="menu-option">
      <button @click="goToWeeklyRecommendation" class="menu-button">
        <span class="menu-button-text">แนะนำเมนูอาหารรายสัปดาห์</span>
      </button>
    </div>

    <!-- ปุ่มสำหรับสุ่มเมนู -->
    <div class="menu-option">
      <button @click="goToRandomMenu" class="menu-button">
        <span class="menu-button-text">สุ่มเมนูอาหาร</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// ไปที่หน้าแนะนำเมนูอาหารรายสัปดาห์
const goToWeeklyRecommendation = () => {
  router.push('/weekly-recommendation')
}

// ไปที่หน้าสุ่มเมนูอาหาร
const goToRandomMenu = () => {
  router.push('/random-menu')
}
</script>

<style scoped>
.menu-selection-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: linear-gradient(135deg, #6c63ff, #f5c3e7);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.title-box {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.menu-option {
  margin-bottom: 1.5rem;
}

.menu-button {
  width: 80%;
  padding: 1.2rem;
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.menu-button:hover {
  background-color: #5548c8;
  transform: scale(1.05);
}

.menu-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.5);
}

.menu-button-text {
  display: block;
  text-align: center;
}

@media (max-width: 600px) {
  .menu-button {
    width: 90%;
    font-size: 1rem;
  }
  h1 {
    font-size: 2rem;
  }
  p {
    font-size: 1rem;
  }
}
</style>
