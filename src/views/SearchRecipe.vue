<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-center">ค้นหาเมนูอาหาร</h1>

      <!-- Search Inputs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาชื่อเมนู..."
          class="p-2 border rounded w-full"
        />

        <!-- ✅ เลือกวิธีการทำ -->
        <select v-model="selectedMethod" class="p-2 border rounded w-full">
          <option value="">ทุกวิธีการทำ</option>
          <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
        </select>

        <!-- ✅ กรอกวัตถุดิบเอง -->
        <input
          v-model="ingredientInput"
          @keyup.enter="addIngredient"
          type="text"
          placeholder="กรอกวัตถุดิบที่มีแล้วกด Enter..."
          class="p-2 border rounded w-full"
        />
      </div>

      <!-- ✅ แสดง tag วัตถุดิบที่กรอก -->
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="(ing, i) in ingredientFilters"
          :key="i"
          class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center"
        >
          {{ ing }}
          <button @click="removeIngredient(i)" class="ml-2 text-red-500">✕</button>
        </span>
      </div>

      <!-- Result List -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          class="bg-white rounded-xl shadow p-4"
        >
          <h2 class="text-xl font-semibold mb-2">{{ recipe.name }}</h2>
          <p class="text-sm text-gray-600 mb-1">วิธีทำ: {{ recipe.method || '-' }}</p>
          <p class="text-sm text-gray-600 mb-2">
            วัตถุดิบ: {{ recipe.ingredients?.join(', ') || '-' }}
          </p>
          <button
            class="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            ดูรายละเอียด
          </button>
        </div>

        <p
          v-if="filteredRecipes.length === 0"
          class="col-span-full text-center text-gray-500"
        >
          ไม่พบเมนูที่ตรงกับเงื่อนไข
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, getDocs } from 'firebase/firestore'

const recipes = ref([])
const searchQuery = ref('')
const selectedMethod = ref('')
const ingredientInput = ref('')
const ingredientFilters = ref([])

// ✅ โหลดข้อมูลล่าสุดจาก Firestore
onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'recipes'))
  recipes.value = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
})

const methods = ['ต้ม', 'ผัด', 'ทอด', 'แกง', 'นึ่ง', 'ยำ', 'อบ', 'ปิ้ง', 'ย่าง']

const filteredRecipes = computed(() => {
  return recipes.value.filter((r) => {
    const nameMatch = r.name
      ?.toLowerCase()
      .includes(searchQuery.value.toLowerCase().trim())
    const methodMatch =
      selectedMethod.value === '' || r.method === selectedMethod.value
    const ingredientsMatch =
      ingredientFilters.value.length === 0 ||
      ingredientFilters.value.every((ing) =>
        r.ingredients.some((ri) =>
          ri.toLowerCase().includes(ing.toLowerCase())
        )
      )
    return nameMatch && methodMatch && ingredientsMatch
  })
})

const addIngredient = () => {
  if (
    ingredientInput.value.trim() &&
    !ingredientFilters.value.includes(ingredientInput.value.trim())
  ) {
    ingredientFilters.value.push(ingredientInput.value.trim())
  }
  ingredientInput.value = ''
}

const removeIngredient = (index) => {
  ingredientFilters.value.splice(index, 1)
}
</script>
