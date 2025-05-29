<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

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
