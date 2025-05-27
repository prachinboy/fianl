<template>
  <div class="random-menu-container">
    <h1>สุ่มเมนูทั้งหมดจากระบบ</h1>
    <button @click="getRandomFood">สุ่มเมนูทั้งหมด</button>

    <div v-if="randomFoods.length" class="result" v-for="(food, index) in randomFoods" :key="index">
      <p><strong>ชื่อเมนู:</strong> {{ food.name }}</p>
      <p><strong>วัตถุดิบ:</strong> {{ food.ingredients.join(', ') }}</p>
      <p><strong>วิธีทำ:</strong> {{ food.method }}</p>
      <p><strong>แคลอรี่:</strong> {{ food.calories }} kcal</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import recipes from '@/data/recipes.json'

const randomFoods = ref([])

// Fisher-Yates shuffle
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const getRandomFood = () => {
  randomFoods.value = shuffle([...recipes]) // ✅ สุ่มทั้งหมดใหม่ทุกครั้ง
}
</script>

<style scoped>
.random-menu-container {
  max-width: 700px;
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
