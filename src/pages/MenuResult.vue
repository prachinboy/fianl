<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-8">📅 เมนูแนะนำรายสัปดาห์</h1>

    <div v-if="weeklyResults.length === 0" class="text-center text-gray-500">ไม่มีเมนูแนะนำ</div>

    <div class="space-y-6" v-else>
      <div
        v-for="(day, index) in weeklyResults"
        :key="index"
        class="bg-white p-5 rounded-xl shadow-md border border-indigo-200"
      >
        <h2 class="text-xl font-bold text-indigo-700 mb-4">📅 {{ day.day }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="meal in day.meals"
            :key="meal.time + ':' + (meal.recipeId || meal.name)"
            class="bg-indigo-50 p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 class="text-lg font-semibold text-indigo-600 mb-1">
              {{ meal.time }}: {{ meal.name }}
            </h3>
            <p class="text-sm text-gray-600 mb-3">
              คะแนนแนะนำ: {{ Number(meal.score ?? 0).toFixed(1) }}
            </p>

            <div class="flex gap-2">
              <button
                @click="toggleLike(meal)"
                class="px-3 py-1 rounded"
                :class="isMealLiked(meal) ? 'bg-pink-200 text-pink-700 hover:bg-pink-300' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'"
              >
                ❤️ {{ isMealLiked(meal) ? 'ยกเลิก' : 'ถูกใจ' }}
              </button>

              <button
                @click="openReviewModal(meal.name)"
                class="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
              >
                📝 รีวิว
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Modal รีวิว -->
    <div v-if="isReviewModalOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 class="text-lg font-bold text-indigo-600 mb-4">📝 รีวิวเมนู: {{ currentMenuName }}</h2>

        <label class="block text-gray-700 font-semibold mb-2">ให้คะแนน (1-5 ดาว)</label>
        <select v-model="reviewRating" class="w-full border rounded p-2 mb-4">
          <option value="1">1 ดาว</option>
          <option value="2">2 ดาว</option>
          <option value="3">3 ดาว</option>
          <option value="4">4 ดาว</option>
          <option value="5">5 ดาว</option>
        </select>

        <label class="block text-gray-700 font-semibold mb-2">ความคิดเห็น</label>
        <textarea
          v-model="reviewComment"
          placeholder="เขียนความคิดเห็นของคุณ..."
          class="w-full border rounded p-2 mb-4"
          rows="3"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button @click="closeReviewModal" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">❌ ยกเลิก</button>
          <button @click="submitReview" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">✅ บันทึก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * รายสัปดาห์ (MenuResult)
 * - โหลดผลลัพธ์จาก route.query.result
 * - โหลด recipes เพื่อทำ index หา recipeId จากชื่อ
 * - โหลด likes ของ user -> แสดงสถานะ ❤️
 * - toggleLike(): setDoc ลง likes เสมอให้มี recipeId
 */
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { db } from '@/firebase/firebaseConfig'
import {
  collection, addDoc, setDoc, doc,
  serverTimestamp,
  query, where, getDocs, orderBy
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const route = useRoute()

const weeklyResults = ref([])          // [{ day, meals:[{ time, name, score, (id?) -> recipeId }] }]
const likedIds = ref([])               // array of recipeId ที่ user like
const recipesIndex = ref({ list: [], exact: new Map() }) // index สำหรับแมตช์ชื่อ → id

// Modal รีวิว
const isReviewModalOpen = ref(false)
const currentMenuName = ref('')
const reviewRating = ref(5)
const reviewComment = ref('')

// ---------- helpers: normalize + similarity ----------
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\s+/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
}
function jaccard(a, b) {
  const A = new Set(String(a).split(''))
  const B = new Set(String(b).split(''))
  let inter = 0
  for (const ch of A) if (B.has(ch)) inter++
  const u = A.size + B.size - inter
  return u ? inter / u : 0
}

// โหลด recipes ทั้งหมดมาทำดัชนี
async function loadRecipesIndex() {
  const snap = await getDocs(collection(db, 'recipes'))
  const list = snap.docs.map(d => ({
    id: d.id,
    name: d.data()?.name || d.data()?.menuName || ''
  }))
  const exact = new Map(list.map(r => [normName(r.name), r.id]))
  recipesIndex.value = { list, exact }
}

// หา recipeId จากชื่อ (exact > contains (unique) > similarity >= 0.6)
function resolveRecipeIdByName(name) {
  const idx = recipesIndex.value
  if (!idx?.list?.length) return null
  const n = normName(name)
  if (!n) return null

  if (idx.exact.has(n)) return idx.exact.get(n)

  const contains = idx.list.filter(r => {
    const rn = normName(r.name)
    return rn.includes(n) || n.includes(rn)
  })
  if (contains.length === 1) return contains[0].id

  let best = null, bestScore = 0
  for (const r of idx.list) {
    const s = jaccard(n, normName(r.name))
    if (s > bestScore) { bestScore = s; best = r }
  }
  return (best && bestScore >= 0.6) ? best.id : null
}

// แนบ recipeId ให้แต่ละเมนูในผลลัพธ์
function attachRecipeIds() {
  for (const day of weeklyResults.value) {
    for (const meal of day.meals) {
      meal.recipeId = meal.id || resolveRecipeIdByName(meal.name) || null
    }
  }
}

// โหลด likes ของ user (แปลงเป็น array ของ recipeId)
async function loadUserLikes(email) {
  const qLikes = query(
    collection(db, 'likes'),
    where('email', '==', email),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(qLikes)
  likedIds.value = snap.docs
    .map(d => d.data()?.recipeId)
    .filter(Boolean)
}

// isLiked สำหรับปุ่ม
function isMealLiked(meal) {
  const rid = meal.recipeId
  return !!rid && likedIds.value.includes(rid)
}

// toggle like -> setDoc likes (idempotent)
async function toggleLike(meal) {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { alert('❌ กรุณา login ก่อน'); return }

  // ensure recipeId
  if (!meal.recipeId) meal.recipeId = meal.id || resolveRecipeIdByName(meal.name)
  const recipeId = meal.recipeId
  if (!recipeId) { alert('❌ หา recipeId ของเมนูนี้ไม่เจอ'); return }

  const docId = `${user.uid || user.email}__${recipeId}`
  const willLike = !isMealLiked(meal)

  await setDoc(doc(collection(db, 'likes'), docId), {
    userId: user.uid || null,
    email:  user.email || null,
    recipeId,
    menuName: meal.name || null,
    liked: willLike,
    timestamp: serverTimestamp()
  }, { merge: true })

  // อัปเดตรายการที่หน้า
  if (willLike) {
    if (!likedIds.value.includes(recipeId)) likedIds.value.push(recipeId)
    alert(`ถูกใจเมนู: ${meal.name}`)
  } else {
    likedIds.value = likedIds.value.filter(id => id !== recipeId)
    alert(`ยกเลิกถูกใจเมนู: ${meal.name}`)
  }
}

// Modal รีวิว
function openReviewModal(menuName) {
  currentMenuName.value = menuName
  reviewRating.value = 5
  reviewComment.value = ''
  isReviewModalOpen.value = true
}
function closeReviewModal() { isReviewModalOpen.value = false }

async function submitReview() {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { alert('❌ กรุณา login ก่อน'); return }

  await addDoc(collection(db, 'reviews'), {
    email: user.email,
    menuName: currentMenuName.value,
    rating: Number(reviewRating.value || 0),
    comment: reviewComment.value || '',
    timestamp: serverTimestamp()
  })
  alert(`✅ บันทึกรีวิวเมนู: ${currentMenuName.value}`)
  closeReviewModal()
}

onMounted(async () => {
  // รับผลลัพธ์จาก route
  if (route.query.result) {
    try {
      weeklyResults.value = JSON.parse(route.query.result) || []
    } catch (e) {
      console.error('parse result error', e)
    }
  }

  const auth = getAuth()
  const user = auth.currentUser

  // บันทึก recommend_logs
  if (user && weeklyResults.value.length > 0) {
    const resultData = []
    for (const day of weeklyResults.value) {
      for (const meal of day.meals) {
        resultData.push({
          name: meal.name || 'ไม่ทราบชื่อเมนู',
          score: meal.score ?? 0,
          type: 'weekly',
          day: day.day,
          time: meal.time
        })
      }
    }
    await addDoc(collection(db, 'recommend_logs'), {
      email: user.email,
      resultData,
      timestamp: serverTimestamp()
    })
  }

  // ทำดัชนี recipes → แนบ recipeId ให้เมนู → โหลด likes
  await loadRecipesIndex()
  attachRecipeIds()
  if (user?.email) await loadUserLikes(user.email)
})
</script>

<style scoped>
/* ใช้ Tailwind */
</style>
