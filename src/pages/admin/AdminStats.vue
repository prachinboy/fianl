<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-purple-50 p-6">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-orange-600 mb-6">📊 สถิติคำแนะนำเมนู</h1>

      <!-- ปุ่มสลับโหมด -->
      <div class="flex space-x-3 mb-6">
        <button @click="viewMode = 'daily'" :class="toggleBtnClass('daily')">📅 สถิติรายวัน</button>
        <button @click="viewMode = 'weekly'" :class="toggleBtnClass('weekly')">📆 รายสัปดาห์</button>
        <button @click="viewMode = 'random'" :class="toggleBtnClass('random')">🎲 แบบสุ่ม</button>
      </div>

      <!-- ✅ สถิติรายวัน -->
      <div v-if="viewMode === 'daily'" class="bg-white shadow-md rounded-xl p-4">
        <h2 class="text-lg font-semibold text-orange-600 mb-4">📅 สถิติรายวัน</h2>
        <ul class="text-sm space-y-2 text-gray-700">
          <li v-for="(item, index) in groupedDailyStats" :key="index"
              class="p-2 border rounded flex justify-between hover:bg-gray-50">
            <span>📅 {{ item.date }}</span>
            <span class="font-bold">{{ item.count }} ครั้ง</span>
          </li>
          <li v-if="groupedDailyStats.length === 0" class="text-gray-400">ยังไม่มีข้อมูลคำแนะนำ</li>
        </ul>
      </div>

      <!-- ✅ รายสัปดาห์ -->
      <div v-if="viewMode === 'weekly'" class="bg-white shadow-md rounded-xl p-4">
        <h2 class="text-lg font-semibold text-purple-600 mb-4">📆 สถิติรายสัปดาห์ (แยกวัน)</h2>
        <div v-for="(days, week) in weeklyGroupedDays" :key="week" class="mb-4">
          <h3 class="font-bold text-indigo-600 mb-2">สัปดาห์ {{ week }}</h3>
          <ul class="text-sm space-y-1 text-gray-700">
            <li v-for="(day, index) in days" :key="index"
                class="p-2 border rounded flex justify-between hover:bg-gray-50">
              <span>📅 {{ day.date }}</span>
              <span class="font-bold">{{ day.count }} ครั้ง</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- ✅ แบบสุ่ม (เรียงวันที่จากใหม่ไปเก่า) -->
      <div v-if="viewMode === 'random'" class="bg-white shadow-md rounded-xl p-4">
        <h2 class="text-lg font-semibold text-pink-600 mb-4">🎲 แสดงสถิติสุ่มจากบางวัน</h2>
        <ul class="text-sm space-y-2 text-gray-700">
          <li v-for="(item, index) in groupedRandomStats" :key="index"
              class="p-2 border rounded flex justify-between hover:bg-gray-50">
            <span>📅 {{ item.date }}</span>
            <span class="font-bold">{{ item.count }} ครั้ง</span>
          </li>
          <li v-if="groupedRandomStats.length === 0" class="text-gray-400">ไม่มีข้อมูลสำหรับแสดง</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'
import dayjs from 'dayjs'
import { useAdminRole } from '@/utils/useAdminRole.js'

const dailyStats = ref([])
const weeklyStats = ref([])
const randomStats = ref([])
const viewMode = ref('daily')
const { isAdmin } = useAdminRole()

onMounted(() => {
  const dailyMap = new Map()
  const weeklyMap = new Map()
  const randomMap = new Map()

  onSnapshot(collection(db, 'recommend_logs'), (snapshot) => {
    dailyMap.clear()
    weeklyMap.clear()
    randomMap.clear()

    snapshot.forEach(doc => {
      const { timestamp, type } = doc.data()
      if (!timestamp) return
      const date = dayjs(timestamp.toDate()).add(7, 'hour').format('YYYY-MM-DD')
      const week = dayjs(timestamp.toDate()).add(7, 'hour').startOf('isoWeek').format('YYYY-[W]WW')

      if (type === 'daily') {
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
      } else if (type === 'weekly') {
        if (!weeklyMap.has(week)) weeklyMap.set(week, new Map())
        const weekDays = weeklyMap.get(week)
        weekDays.set(date, (weekDays.get(date) || 0) + 1)
      } else if (type === 'randommenu') {
        randomMap.set(date, (randomMap.get(date) || 0) + 1)
      }
    })

    dailyStats.value = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }))
    weeklyStats.value = Array.from(weeklyMap.entries()).map(([week, daysMap]) => ({
      week,
      days: Array.from(daysMap.entries()).map(([date, count]) => ({ date, count }))
    }))
    randomStats.value = Array.from(randomMap.entries()).map(([date, count]) => ({ date, count }))
  })
})

const groupedDailyStats = computed(() =>
  dailyStats.value.slice().sort((a, b) => (a.date < b.date ? 1 : -1))
)

const weeklyGroupedDays = computed(() => {
  const grouped = {}
  weeklyStats.value.forEach((week) => {
    grouped[week.week] = week.days.sort((a, b) => (a.date < b.date ? 1 : -1))
  })
  return grouped
})

const groupedRandomStats = computed(() =>
  randomStats.value.slice().sort((a, b) => (a.date < b.date ? 1 : -1))
)

const toggleBtnClass = (mode) =>
  `px-4 py-2 rounded-xl font-semibold ${
    viewMode.value === mode
      ? 'bg-orange-500 text-white shadow'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
  }`
</script>

<style scoped>
/* ใช้ Tailwind CSS */
</style>
