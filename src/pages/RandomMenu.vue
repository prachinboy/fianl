<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
      <h1 class="text-2xl font-bold text-indigo-700 mb-4">🎲 สุ่มเมนูอาหาร</h1>

      <!-- แสดงเมนูสุ่ม -->
      <div v-if="randomMenuItem" class="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-4">
        <h2 class="text-lg font-semibold text-gray-800">
          🍽️ {{ randomMenuItem.name }}
        </h2>
        <p class="text-sm text-gray-600">หมวดหมู่: {{ randomMenuItem.type }}</p>
      </div>
      <p v-else class="text-gray-500">ยังไม่ได้สุ่มเมนู</p>

      <!-- ปุ่มสุ่ม -->
      <button
        @click="getRandomMenu"
        class="w-full py-2 mt-4 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition"
      >
        🔄 สุ่มเมนูใหม่
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";

const menus = ref([]);
const randomMenuItem = ref(null);

// ✅ ดึงข้อมูลเมนูจาก Firestore
const fetchMenus = async () => {
  const snapshot = await getDocs(collection(db, "recipes"));
  menus.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ✅ ฟังก์ชันสุ่มเมนู
const getRandomMenu = async () => {
  if (menus.value.length === 0) {
    alert("❌ ไม่มีเมนูในระบบ");
    return;
  }
  const randomIndex = Math.floor(Math.random() * menus.value.length);
  randomMenuItem.value = menus.value[randomIndex];

  // ✅ บันทึกการสุ่มเมนูลง Firestore (recommend_logs)
  await logRandomMenu();
};

// ✅ บันทึก Log
const logRandomMenu = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  try {
    await addDoc(collection(db, "recommend_logs"), {
      userId: user ? user.uid : "guest",
      action: "random_menu",
      menuName: randomMenuItem.value?.name || "-",
      timestamp: serverTimestamp(),
       type: 'randommenu',
    });
    console.log("✅ บันทึกการสุ่มเมนูสำเร็จ");
  } catch (error) {
    console.error("❌ บันทึกการสุ่มเมนูล้มเหลว:", error.message);
  }
};

onMounted(fetchMenus);
</script>

<style scoped>
/* ใช้ Tailwind CSS */
</style>