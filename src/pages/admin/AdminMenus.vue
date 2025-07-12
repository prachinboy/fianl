<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-100 p-6">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-purple-600 mb-6">📦 จัดการเมนูอาหาร</h1>

      <!-- ปุ่มเพิ่มเมนู -->
      <div class="mb-4 text-right">
        <button @click="goToAddMenu"
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          ➕ เพิ่มเมนูใหม่
        </button>
      </div>

      <!-- ตารางเมนู -->
      <table class="w-full bg-white shadow-md rounded-xl overflow-hidden text-sm">
        <thead class="bg-indigo-200 text-indigo-800 font-semibold">
          <tr>
            <th class="p-3 text-left">ชื่อเมนู</th>
            <th class="p-3 text-left">วัตถุดิบ</th>
            <th class="p-3 text-left">หมวดหมู่</th>
            <th class="p-3 text-center">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="menu in menus" :key="menu.id" class="border-t hover:bg-indigo-50">
            <td class="p-3">{{ menu.name }}</td>
            <td class="p-3">{{ menu.ingredients.join(', ') }}</td>
            <td class="p-3">{{ menu.category }}</td>
            <td class="p-3 text-center space-x-2">
              <button @click="editMenu(menu.id)" class="text-blue-600 hover:underline">แก้ไข</button>
              <button @click="deleteMenu(menu.id)" class="text-red-600 hover:underline">ลบ</button>
            </td>
          </tr>
          <tr v-if="menus.length === 0">
            <td colspan="4" class="text-center text-gray-500 p-4">ไม่มีเมนูในระบบ</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/firebaseConfig'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

const menus = ref([])
const router = useRouter()

const fetchMenus = async () => {
  const snapshot = await getDocs(collection(db, 'recipes'))
  menus.value = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

const deleteMenu = async (id) => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?')) {
    await deleteDoc(doc(db, 'recipes', id))
    fetchMenus()
  }
}

const editMenu = (id) => {
  router.push(`/edit-menu/${id}`) // ยังไม่ได้สร้างหน้านี้
}

const goToAddMenu = () => {
  router.push('/admin/add-menu')
}

onMounted(fetchMenus)
</script>
