<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-purple-50 p-6">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-orange-600 mb-6">📊 สถิติคำแนะนำเมนู</h1>

      <!-- ปุ่มสลับโหมด -->
      <div class="flex space-x-3 mb-6">
        <button @click="viewMode = 'daily'" :class="toggleBtnClass('daily')">📅 สถิติรายวัน</button>
        <button @click="viewMode = 'weekly'" :class="toggleBtnClass('weekly')">📈 กราฟคำแนะนำรายสัปดาห์</button>
      </div>

      <!-- ตารางสถิติรายวัน -->
      <div v-if="viewMode === 'daily'" class="bg-white shadow-md rounded-xl p-4">
        <table class="w-full text-sm">
          <thead class="bg-orange-200 text-orange-800 font-semibold">
            <tr>
              <th class="p-2 text-left">วันที่</th>
              <th class="p-2 text-left">ชื่อเมนู</th>
              <th class="p-2 text-center">จำนวนที่แนะนำ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in sortedDailyStats" :key="index" class="hover:bg-orange-50 border-b">
              <td class="p-2">{{ item.date }}</td>
              <td class="p-2">{{ item.name }}</td>
              <td class="p-2 text-center font-bold">{{ item.count }}</td>
            </tr>
            <tr v-if="sortedDailyStats.length === 0">
              <td colspan="3" class="text-center text-gray-500 p-4">ยังไม่มีข้อมูลคำแนะนำ</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- กราฟรายสัปดาห์ -->
      <div v-if="viewMode === 'weekly'" class="bg-white shadow-md rounded-xl p-4">
        <h2 class="text-lg font-semibold text-purple-600 mb-4">📉 กราฟคำแนะนำเมนูรายสัปดาห์</h2>
        <LineChart :labels="weeklyLabels" :data="weeklyData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'
import dayjs from 'dayjs'
import LineChart from '@/components/LineChart.vue'

const dailyStats = ref([])
const weeklyStats = ref([])
const viewMode = ref('daily')

onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'recommend_logs'))
  const dailyMap = new Map()
  const weeklyMap = new Map()

  snapshot.forEach(doc => {
    const { name, timestamp } = doc.data()
    const date = dayjs(timestamp.toDate()).format('YYYY-MM-DD')
    const week = dayjs(timestamp.toDate()).startOf('isoWeek').format('YYYY-[W]WW')

    const dailyKey = `${date}-${name}`
    const weeklyKey = week

    // Daily
    if (!dailyMap.has(dailyKey)) dailyMap.set(dailyKey, { date, name, count: 1 })
    else dailyMap.get(dailyKey).count++

    // Weekly
    if (!weeklyMap.has(weeklyKey)) weeklyMap.set(weeklyKey, 1)
    else weeklyMap.set(weeklyKey, weeklyMap.get(weeklyKey) + 1)
  })

  dailyStats.value = Array.from(dailyMap.values())
  weeklyStats.value = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }))
})

const sortedDailyStats = computed(() =>
  dailyStats.value.slice().sort((a, b) => (a.date < b.date ? 1 : -1))
)

const weeklyLabels = computed(() => weeklyStats.value.map(i => i.week))
const weeklyData = computed(() => weeklyStats.value.map(i => i.count))

const toggleBtnClass = (mode) =>
  `px-4 py-2 rounded-xl font-semibold ${
    viewMode.value === mode
      ? 'bg-orange-500 text-white shadow'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
  }`
</script>

<style scoped>
/* ใช้ Tailwind CSS ทั้งหมด */
</style>
