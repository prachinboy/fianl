<template>
  <div class="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-purple-100 p-6">
    <h1 class="text-3xl font-bold text-center text-purple-700 mb-8">
      👥 จัดการผู้ใช้
    </h1>

    <div v-if="loading" class="text-center text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</div>

    <table v-else class="w-full bg-white rounded-xl shadow-md overflow-hidden">
      <thead class="bg-purple-100 text-left text-sm text-gray-700">
        <tr>
          <th class="px-4 py-3">ชื่อ</th>
          <th class="px-4 py-3">อีเมล</th>
          <th class="px-4 py-3">สถานะ</th>
          <th class="px-4 py-3 text-right">การจัดการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in users" :key="user.id" class="border-t text-sm">
          <td class="px-4 py-2">{{ user.displayName || '-' }}</td>
          <td class="px-4 py-2">{{ user.email }}</td>
          <td class="px-4 py-2">{{ user.role || 'ผู้ใช้ทั่วไป' }}</td>
          <td class="px-4 py-2 text-right space-x-2">
            <!-- ✅ ปุ่มลบ -->
            <button
              v-if="user.email !== currentUserEmail && user.role !== 'admin'"
              @click="deleteUser(user.id)"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ลบ
            </button>

            <!-- ✅ ปุ่ม Active / Inactive -->
            <button
              v-if="user.email !== currentUserEmail"
              @click="toggleStatus(user.id, user.status)"
              :class="user.status === 'inactive'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-yellow-500 hover:bg-yellow-600'"
              class="text-white px-3 py-1 rounded"
            >
              {{ user.status === 'inactive' ? 'เปิดใช้งาน' : 'ระงับ' }}
            </button>

            <!-- ✅ ปุ่มตั้งเป็นแอดมิน -->
            <button
              v-if="user.role !== 'admin'"
              @click="promoteToAdmin(user.id)"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ตั้งเป็นแอดมิน
            </button>

            <button
              v-if="user.role === 'admin' && user.email !== currentUserEmail"
              @click="revokeAdmin(user.id)"
              class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              ถอนสิทธิ์แอดมิน
            </button>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="4" class="px-4 py-4 text-center text-gray-500">
            ยังไม่มีข้อมูลผู้ใช้
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { useAdminRole } from '@/utils/useAdminRole.js'

const users = ref([])
const loading = ref(true)
const currentUserEmail = JSON.parse(localStorage.getItem('user') || 'null')?.email || ''
const { isAdmin } = useAdminRole()
// ✅ โหลดผู้ใช้
const fetchUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'))
  users.value = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }))
  loading.value = false
}

// ✅ ลบผู้ใช้
const deleteUser = async (id) => {
  const confirmDelete = confirm(`คุณต้องการลบผู้ใช้นี้หรือไม่?`)
  if (!confirmDelete) return

  try {
    await deleteDoc(doc(db, 'users', id))
    users.value = users.value.filter(u => u.id !== id)
    alert(`✅ ลบผู้ใช้เรียบร้อยแล้ว`)
  } catch (err) {
    console.error(err)
    alert('❌ ลบไม่สำเร็จ')
  }
}

// ✅ Active / Inactive
const toggleStatus = async (id, currentStatus) => {
  const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive'
  try {
    await updateDoc(doc(db, 'users', id), { status: newStatus })
    alert(newStatus === 'inactive' ? '✅ ระงับบัญชีสำเร็จ' : '✅ เปิดใช้งานสำเร็จ')
    fetchUsers()
  } catch (err) {
    console.error(err)
    alert('❌ ไม่สามารถอัปเดตสถานะได้')
  }
}

// ✅ ตั้งเป็นแอดมิน
const promoteToAdmin = async (id) => {
  try {
    await updateDoc(doc(db, 'users', id), {
      role: 'admin',
      isAdmin: true,
    })
    alert(`✅ ตั้งเป็นแอดมินแล้ว`)
    fetchUsers()
  } catch (err) {
    console.error(err)
    alert('❌ ตั้งแอดมินไม่สำเร็จ')
  }
}

// ✅ ถอนสิทธิ์แอดมิน
const revokeAdmin = async (id) => {
  const confirmRevoke = confirm(`คุณต้องการถอนสิทธิ์แอดมินของผู้ใช้นี้หรือไม่?`)
  if (!confirmRevoke) return

  try {
    await updateDoc(doc(db, 'users', id), {
      role: 'user',
      isAdmin: false,
    })
    alert(`✅ ถอนสิทธิ์แอดมินแล้ว`)
    fetchUsers()
  } catch (err) {
    console.error(err)
    alert('❌ ถอนสิทธิ์ไม่สำเร็จ')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
