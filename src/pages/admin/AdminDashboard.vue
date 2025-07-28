<template>
  <div class="min-h-screen bg-gradient-to-tr from-purple-50 via-white to-indigo-50 py-12 px-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-center text-purple-600 mb-10">🛠 หน้าจัดการระบบแอดมิน</h1>

    <div class="grid sm:grid-cols-2 gap-6">
      <!-- จัดการผู้ใช้ -->
      <div @click="goToUsers"
           class="cursor-pointer bg-gradient-to-r from-blue-100 to-white rounded-xl p-6 shadow hover:shadow-md hover:scale-[1.01] transition">
        <h2 class="text-xl font-semibold text-blue-600 mb-2">👥 จัดการผู้ใช้</h2>
        <p class="text-sm text-gray-600">ดูรายชื่อผู้ใช้ทั้งหมด ปรับสิทธิ์ และลบผู้ใช้ที่ไม่เหมาะสม</p>
      </div>

      <!-- จัดการเมนูอาหาร -->
      <div @click="goToMenus"
           class="cursor-pointer bg-gradient-to-r from-purple-100 to-white rounded-xl p-6 shadow hover:shadow-md hover:scale-[1.01] transition">
        <h2 class="text-xl font-semibold text-purple-600 mb-2">📦 จัดการเมนูอาหาร</h2>
        <p class="text-sm text-gray-600">ตรวจสอบและอนุมัติเบื้องต้นเมนูอาหารใหม่</p>
      </div>

      <!-- สถิติคำแนะนำเมนู -->
      <div @click="goToStats"
           class="cursor-pointer bg-gradient-to-r from-orange-200 to-white rounded-xl p-6 shadow hover:shadow-md hover:scale-[1.01] transition">
        <h2 class="text-xl font-semibold text-orange-600 mb-2">📈 สถิติคำแนะนำเมนู</h2>
        <p class="text-sm text-gray-600">ตรวจสอบเมนูยอดนิยม และพฤติกรรมการใช้งาน</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAdminRole } from '@/utils/useAdminRole.js'
const router = useRouter()
const { isAdmin } = useAdminRole()
const goToUsers = () => router.push('/admin/users')
const goToMenus = () => router.push('/admin/menus')
const goToStats = () => router.push('/admin/stats')
</script>

<style scoped>
/* ใช้ Tailwind CSS เป็นหลัก */
</style>
