<template>
  <!-- ✅ แสดง Navbar เฉพาะหน้า /home -->
  <Navbar v-if="route.path === '/home'" />

  <!-- แสดงเนื้อหาแต่ละหน้า -->
  <router-view />
</template>

<script setup>
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'

const route = useRoute()
</script>

<style>
body.light {
  background-color: #f5f5f5;
  color: #222;
}

body.dark {
  background-color: #1e1e1e;
  color: #eee;
}
</style>
