<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-center">ค้นหาเมนูอาหาร</h1>

      <!-- Search Inputs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อเมนู..."
               class="p-2 border rounded w-full">

        <select v-model="selectedCategory" class="p-2 border rounded w-full">
          <option value="">ทุกประเภท</option>
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>

        <input v-model="ingredientFilter" type="text" placeholder="กรอกวัตถุดิบที่มี..."
               class="p-2 border rounded w-full">
      </div>

      <!-- Result List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="recipe in filteredRecipes" :key="recipe.id"
             class="bg-white rounded-xl shadow p-4">
          <h2 class="text-xl font-semibold mb-2">{{ recipe.name }}</h2>
          <p class="text-sm text-gray-600 mb-1">ประเภท: {{ recipe.category }}</p>
          <p class="text-sm text-gray-600 mb-2">วัตถุดิบ: {{ recipe.ingredients.join(', ') }}</p>
          <button class="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            ดูรายละเอียด
          </button>
        </div>
        <p v-if="filteredRecipes.length === 0" class="col-span-full text-center text-gray-500">
          ไม่พบเมนูที่ตรงกับเงื่อนไข
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import recipes from '@/data/recipes.json'

export default {
  data() {
    return {
      searchQuery: '',
      selectedCategory: '',
      ingredientFilter: '',
      recipes,
    };
  },
  computed: {
    filteredRecipes() {
      return this.recipes.filter((r) => {
        const nameMatch = r.name.toLowerCase().includes(this.searchQuery.toLowerCase().trim());
        const categoryMatch = this.selectedCategory === '' || r.category === this.selectedCategory;
        const ingredientMatch =
          this.ingredientFilter === '' ||
          r.ingredients.some((ing) => ing.includes(this.ingredientFilter.trim()));

        return nameMatch && categoryMatch && ingredientMatch;
      });
    },
    categories() {
      return [...new Set(this.recipes.map((r) => r.category))];
    },
  },
};
</script>