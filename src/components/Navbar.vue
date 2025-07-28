<template>
  <!-- ✅ แสดง Navbar เฉพาะหน้า /home -->
  <nav
    v-if="route.path === '/home'"
    class="flex justify-between items-center p-4 bg-orange-50 shadow-md z-50"
  >
    <!-- โลโก้ -->
    <div class="text-orange-600 font-extrabold text-xl border-2 border-orange-300 rounded-full px-4 py-1">
      FoodReco
    </div>

    <!-- เมนูฟีเจอร์ -->
    <div class="flex items-center gap-3">
      <router-link
        to="/home"
        class="px-4 py-1 rounded-full border border-orange-300 hover:bg-orange-100 text-orange-800"
        :class="{ 'bg-orange-200 font-semibold': route.path === '/home' }"
      >
        หน้าแรก
      </router-link>

      <router-link
        to="/menu-selection"
        class="px-4 py-1 rounded-full border border-orange-300 hover:bg-orange-100 text-orange-800"
        :class="{ 'bg-orange-200 font-semibold': route.path === '/menu-selection' }"
      >
        เลือกเมนู
      </router-link>

      <router-link
        to="/search"
        class="px-4 py-1 rounded-full border border-orange-300 hover:bg-orange-100 text-orange-800"
        :class="{ 'bg-orange-200 font-semibold': route.path === '/search' }"
      >
        ค้นหาเมนู
      </router-link>

      <router-link
        to="/login"
        class="px-4 py-1 rounded-full border border-orange-300 hover:bg-orange-100 text-orange-800"
        :class="{ 'bg-orange-200 font-semibold': route.path === '/login' }"
      >
        เข้าสู่ระบบ
      </router-link>

      <router-link
        to="/signup"
        class="px-4 py-1 rounded-full border border-orange-300 hover:bg-orange-100 text-orange-800"
        :class="{ 'bg-orange-200 font-semibold': route.path === '/signup' }"
      >
        สมัครสมาชิก
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAdminRole } from '@/utils/useAdminRole.js'
const route = useRoute()
const { isAdmin } = useAdminRole()
</script>
