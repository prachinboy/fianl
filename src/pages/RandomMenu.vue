<template>
  <div class="random-menu-container">
    <h1> สุ่มเมนูตามดวง</h1>
    <button @click="getRandomFood">สุ่มเมนู</button>

    <div v-if="randomFood" class="result">
      <p><strong>ชื่อเมนู:</strong> {{ randomFood.name }}</p>
      <p><strong>วัตถุดิบ:</strong> {{ randomFood.ingredients.join(', ') }}</p>
      <p><strong>วิธีทำ:</strong> {{ randomFood.method }}</p>
      <p><strong>แคลอรี่:</strong> {{ randomFood.calories }} kcal</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import recipes from '@/data/recipes.json'

const randomFood = ref(null)

const getRandomFood = () => {
  const index = Math.floor(Math.random() * recipes.length)
  randomFood.value = recipes[index]
}
</script>

<style scoped>
.random-menu-container {
  max-width: 600px;
  margin: 2rem auto;
  background: #f4f7ff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #6c63ff;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

button {
  padding: 0.75rem 1.5rem;
  background-color: #6c63ff;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background-color: #5146d8;
}

.result {
  margin-top: 2rem;
  text-align: left;
  background: #fff;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
</style>