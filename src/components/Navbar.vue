<template>
  <nav class="flex justify-between items-center p-4 bg-orange-50 shadow-md z-50">
    <!-- Project Logo -->
    <div class="text-orange-600 font-extrabold text-xl px-4 py-1 rounded-full border-2 border-orange-300 bg-white">
      FoodReco
    </div>

    <!-- Navigation Links -->
    <div class="flex items-center gap-3">
      <router-link
        to="/menu-selection"
        class="px-4 py-1 rounded-full border-2 transition
               border-orange-300 bg-orange-100 text-orange-700 font-semibold"
        :class="{ 'bg-orange-200 text-orange-800 border-orange-400': $route.path === '/menu-selection' }"
      >เลือกเมนู</router-link>

      <router-link
        to="/search"
        class="px-4 py-1 rounded-full border-2 transition
               border-orange-300 bg-orange-100 text-orange-700 font-semibold"
        :class="{ 'bg-orange-200 text-orange-800 border-orange-400': $route.path === '/search' }"
      >ค้นหาเมนู</router-link>

      <router-link
        to="/login"
        class="px-4 py-1 rounded-full border-2 transition
               border-orange-300 bg-orange-100 text-orange-700 font-semibold"
        :class="{ 'bg-orange-200 text-orange-800 border-orange-400': $route.path === '/login' }"
      >เข้าสู่ระบบ</router-link>

      <router-link
        to="/signup"
        class="px-4 py-1 rounded-full border-2 transition
               border-orange-300 bg-orange-100 text-orange-700 font-semibold"
        :class="{ 'bg-orange-200 text-orange-800 border-orange-400': $route.path === '/signup' }"
      >สมัครสมาชิก</router-link>

      <router-link
        to="/home"
        class="px-4 py-1 rounded-full border-2 transition
               border-orange-300 bg-orange-100 text-orange-700 font-semibold"
        :class="{ 'bg-orange-200 text-orange-800 border-orange-400': $route.path === '/home' }"
      >หน้าแรก</router-link>
    </div>
  </nav>
</template>

<script setup>
// ไม่มี logic JS
</script>

<style scoped>
/* ไม่จำเป็นต้องใช้ @apply */
</style>
