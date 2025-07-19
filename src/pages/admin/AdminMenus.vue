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
            <td class="p-3">{{ menu.type || menu.category }}</td>
            <td class="p-3 text-center space-x-2">
              <button @click="startEdit(menu)" class="text-blue-600 hover:underline">แก้ไข</button>
              <button @click="deleteMenu(menu.id)" class="text-red-600 hover:underline">ลบ</button>
            </td>
          </tr>
          <tr v-if="menus.length === 0">
            <td colspan="4" class="text-center text-gray-500 p-4">ไม่มีเมนูในระบบ</td>
          </tr>
        </tbody>
      </table>

      <!-- Modal แก้ไขเมนู -->
      <div v-if="editingMenu"
           class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div class="bg-white p-6 rounded-lg shadow-lg w-96">
          <h3 class="text-lg font-bold mb-4">✏️ แก้ไขเมนู</h3>

          <label class="block mb-2">ชื่อเมนู</label>
          <input v-model="editData.name" class="w-full border p-2 rounded mb-3" />

          <label class="block mb-2">วัตถุดิบ (คั่นด้วย ,)</label>
          <input v-model="editIngredients" class="w-full border p-2 rounded mb-3" />

          <label class="block mb-2">ประเภท</label>
          <input v-model="editData.type" class="w-full border p-2 rounded mb-3" />

          <div class="flex justify-end gap-2">
            <button class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    @click="cancelEdit">
              ❌ ยกเลิก
            </button>
            <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    @click="saveEdit">
              ✅ บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/firebaseConfig'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'

const menus = ref([])
const router = useRouter()

// สำหรับแก้ไข
const editingMenu = ref(null)
const editData = ref({ name: '', type: '' })
const editIngredients = ref('')

// ✅ โหลดเมนูจาก Firestore
const fetchMenus = async () => {
  const snapshot = await getDocs(collection(db, 'recipes'))
  menus.value = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }))
}

// ✅ ลบเมนู
const deleteMenu = async (id) => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?')) {
    await deleteDoc(doc(db, 'recipes', id))
    alert('🗑️ ลบเมนูสำเร็จ')
    fetchMenus()
  }
}

// ✅ เริ่มแก้ไข
const startEdit = (menu) => {
  editingMenu.value = menu
  editData.value = { name: menu.name, type: menu.type || menu.category }
  editIngredients.value = menu.ingredients.join(', ')
}

// ✅ ยกเลิกการแก้ไข
const cancelEdit = () => {
  editingMenu.value = null
}

// ✅ บันทึกการแก้ไข
const saveEdit = async () => {
  const menuRef = doc(db, 'recipes', editingMenu.value.id)
  await updateDoc(menuRef, {
    name: editData.value.name,
    type: editData.value.type,
    ingredients: editIngredients.value.split(',').map(i => i.trim())
  })
  alert('✅ แก้ไขเมนูสำเร็จ!')
  editingMenu.value = null
  await fetchMenus()
}

// ✅ ไปหน้าเพิ่มเมนูใหม่
const goToAddMenu = () => {
  router.push('/admin/add-menu')
}

onMounted(fetchMenus)
</script>
