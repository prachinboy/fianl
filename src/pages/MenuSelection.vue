<template>
  <div class="min-h-screen bg-gradient-to-br from-[#d8d5f2] via-[#e4e2f0] to-[#d0d3e4] flex items-center justify-center px-4 py-12">
    <div class="max-w-5xl w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-indigo-700 mb-2">🍽️ เลือกรูปแบบการแนะนำเมนู</h1>
        <p class="text-gray-700">กรุณาเลือกประเภทเมนูอาหารที่คุณต้องการให้ระบบแนะนำ</p>
      </div>

      <!-- ✅ Grid 3 คอลัมน์ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- ✅ รายสัปดาห์ -->
        <button
          @click="goToWeeklyRecommendation"
          class="rounded-xl bg-gradient-to-r from-indigo-400 to-indigo-600 text-white py-6 px-4 shadow-lg hover:scale-105 transition-transform"
        >
          <div class="flex flex-col items-center">
            <span class="text-4xl mb-2">📅</span>
            <span class="text-lg font-semibold">แนะนำเมนูอาหารรายสัปดาห์</span>
            <span class="text-sm mt-1 text-white/90">เหมาะกับผู้ที่ต้องการวางแผนอาหารล่วงหน้า</span>
          </div>
        </button>

        <!-- ✅ สุ่มเมนู -->
        <button
          @click="goToRandomMenu"
          class="rounded-xl bg-gradient-to-r from-pink-400 to-rose-500 text-white py-6 px-4 shadow-lg hover:scale-105 transition-transform"
        >
          <div class="flex flex-col items-center">
            <span class="text-4xl mb-2">🍲</span>
            <span class="text-lg font-semibold">สุ่มเมนูอาหาร</span>
            <span class="text-sm mt-1 text-white/90">เหมาะสำหรับผู้ที่ต้องการลองอะไรใหม่</span>
          </div>
        </button>

        <!-- ✅ รายวัน -->
        <button
          @click="goToDailyRecommendation"
          class="rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 text-white py-6 px-4 shadow-lg hover:scale-105 transition-transform"
        >
          <div class="flex flex-col items-center">
            <span class="text-4xl mb-2">☀️</span>
            <span class="text-lg font-semibold">แนะนำอาหารรายวัน</span>
            <span class="text-sm mt-1 text-white/90">แนะนำเมนูเช้า กลางวัน เย็น</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goToWeeklyRecommendation = () => {
  router.push('/weekly-recommendation')
}

const goToRandomMenu = () => {
  router.push('/random-menu')
}

const goToDailyRecommendation = () => {
  router.push('/daily-recommendation')
}
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
