<template>
  <div>
    <Navbar />  <!-- ✅ เพิ่มส่วนนี้ -->
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'  // ✅ เพิ่มส่วนนี้

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light'
  document.body.className = savedTheme
})
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
