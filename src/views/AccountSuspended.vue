<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gray-100">
    <div class="bg-white shadow-md rounded-lg p-8 text-center max-w-md">
      <h1 class="text-2xl font-bold text-red-600 mb-4">🚫 บัญชีนี้ถูกระงับการใช้งาน</h1>
      <p class="text-gray-600 mb-6">
        บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบหากคิดว่านี่เป็นความผิดพลาด
      </p>
      <button
        @click="logout"
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        ออกจากระบบ
      </button>
    </div>
  </div>
</template>

<script setup>
import { getAuth, signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = async () => {
  const auth = getAuth()
  await signOut(auth)
  router.push("/login")
}
</script>
