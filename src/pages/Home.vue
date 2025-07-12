<template>
  <div class="min-h-screen bg-gradient-to-tr from-blue-100 via-purple-50 to-indigo-100 py-12 px-6 md:px-10">
    <!-- Hero Section -->
    <div class="max-w-6xl mx-auto text-center mb-10">
      <h1 class="text-4xl md:text-5xl font-extrabold text-orange-600 mb-4 flex justify-center items-center gap-2">
        <span class="text-5xl">🔍</span> ค้นหาเมนูจากวัตถุดิบในครัวของคุณ
      </h1>
      <p class="text-gray-700 text-lg">
        กรอกวัตถุดิบของคุณ แล้วเราจะแนะนำเมนูเด็ด ๆ ที่ทำได้จากของที่มีเลย!
      </p>
    </div>

    <!-- Input + Button -->
    <div class="max-w-6xl mx-auto bg-white shadow-2xl rounded-2xl p-8 flex flex-col md:flex-row items-center gap-4">
      <input
        v-model="ingredientInput"
        placeholder="เช่น ไข่, ไก่, กระเทียม"
        class="w-full p-4 border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        @click="recommendMenu"
        class="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition"
      >
        แนะนำเมนูจากวัตถุดิบนี้
      </button>
    </div>

    <!-- Result Section -->
    <div v-if="matchedRecipes.length > 0" class="max-w-6xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="(recipe, index) in matchedRecipes"
        :key="recipe.id"
        :class="[
          'bg-orange-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition border-2 border-orange-300'
        ]"
      >
        <h2 class="text-xl font-bold text-orange-600 mb-2">🍽️ {{ recipe.name }}</h2>
        <p class="text-gray-600 text-sm">วัตถุดิบ: {{ recipe.ingredients.join(', ') }}</p>
      </div>
    </div>

    <div v-else-if="hasSearched" class="text-center text-gray-500 text-lg mt-10">
      ไม่พบเมนูที่ตรงกับวัตถุดิบที่กรอก 😢
    </div>
  </div>
</template>

<script>
import recipes from '@/data/recipes.json'

export default {
  name: 'HomePage',
  data() {
    return {
      ingredientInput: '',
      matchedRecipes: [],
      hasSearched: false,
    }
  },
  methods: {
    recommendMenu() {
      const ingredients = this.ingredientInput
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i)

     this.matchedRecipes = recipes.filter((r) =>
  ingredients.every((inputIng) =>
    r.ingredients.some((realIng) => realIng.includes(inputIng))
  )
)


      this.hasSearched = true
    },
  },
}
</script>

<style scoped>
nav a.router-link-exact-active {
  border: 2px solid #fb923c;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  background-color: #ffedd5;
  color: #ea580c;
  font-weight: 600;
}

nav .text-orange-logo {
  border: 2px solid #fb923c;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  background-color: #fff7ed;
  color: #ea580c;
  font-weight: 800;
  font-size: 1.25rem;
}
</style>
