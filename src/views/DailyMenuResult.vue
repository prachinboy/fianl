<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-8">🍽️ เมนูแนะนำประจำวัน</h1>

    <div v-if="menus.length === 0" class="text-center text-gray-500">ไม่มีเมนูแนะนำ</div>

    <div class="space-y-6" v-else>
      <div
        v-for="(menu, index) in menus"
        :key="(menu.recipeId || menu.id || menu.name) + ':' + index"
        class="bg-white p-4 rounded-xl shadow hover:shadow-md transition border border-indigo-200"
      >
        <h2 class="text-lg font-bold text-indigo-600 mb-1">
          {{ mealTime[index] }}: {{ menu.name }}
        </h2>
        <p class="text-sm text-gray-600 mb-2">คะแนนแนะนำ: {{ Number(menu.score ?? 0).toFixed(1) }}</p>

        <div class="flex gap-2">
          <button
            @click="toggleLike(menu)"
            class="px-3 py-1 rounded"
            :class="isMenuLiked(menu) ? 'bg-pink-200 text-pink-700 hover:bg-pink-300' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'"
          >
            ❤️ {{ isMenuLiked(menu) ? 'ยกเลิก' : 'ถูกใจ' }}
          </button>

          <button
            @click="openReviewModal(menu.name)"
            class="px-3 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-500"
          >
            📝 รีวิว
          </button>
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
 * รายวัน (DailyMenuResult)
 * - หลักการเหมือนรายสัปดาห์: แนบ recipeId ให้เมนู → ❤️ จะ setDoc likes ด้วย recipeId เสมอ
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

const menus = ref([])                  // [{ name, score, (id?) -> recipeId }]
const likedIds = ref([])               // recipeId[]
const mealTime = ['เช้า', 'กลางวัน', 'เย็น']

const recipesIndex = ref({ list: [], exact: new Map() })

// Modal รีวิว
const isReviewModalOpen = ref(false)
const currentMenuName = ref('')
const reviewRating = ref(5)
const reviewComment = ref('')

// ---- helpers ----
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

async function loadRecipesIndex() {
  const snap = await getDocs(collection(db, 'recipes'))
  const list = snap.docs.map(d => ({
    id: d.id,
    name: d.data()?.name || d.data()?.menuName || ''
  }))
  const exact = new Map(list.map(r => [normName(r.name), r.id]))
  recipesIndex.value = { list, exact }
}

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

function attachRecipeIds() {
  for (const menu of menus.value) {
    menu.recipeId = menu.id || resolveRecipeIdByName(menu.name) || null
  }
}

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

function isMenuLiked(menu) {
  const rid = menu.recipeId
  return !!rid && likedIds.value.includes(rid)
}

async function toggleLike(menu) {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { alert('❌ กรุณา login ก่อน'); return }

  if (!menu.recipeId) menu.recipeId = menu.id || resolveRecipeIdByName(menu.name)
  const recipeId = menu.recipeId
  if (!recipeId) { alert('❌ หา recipeId ของเมนูนี้ไม่เจอ'); return }

  const docId = `${user.uid || user.email}__${recipeId}`
  const willLike = !isMenuLiked(menu)

  await setDoc(doc(collection(db, 'likes'), docId), {
    userId: user.uid || null,
    email:  user.email || null,
    recipeId,
    menuName: menu.name || null,
    liked: willLike,
    timestamp: serverTimestamp()
  }, { merge: true })

  if (willLike) {
    if (!likedIds.value.includes(recipeId)) likedIds.value.push(recipeId)
    alert(`ถูกใจเมนู: ${menu.name}`)
  } else {
    likedIds.value = likedIds.value.filter(id => id !== recipeId)
    alert(`ยกเลิกถูกใจเมนู: ${menu.name}`)
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
  if (route.query.result) {
    try {
      menus.value = JSON.parse(route.query.result) || []
    } catch (e) {
      console.error('parse result error', e)
    }
  }

  const auth = getAuth()
  const user = auth.currentUser

  // บันทึก recommend_logs
  if (user && menus.value.length > 0) {
    const resultData = [
      {
        day: 'เมนูรายวัน',
        meals: menus.value.map((m, i) => ({
          name: m.name,
          score: m.score ?? 0,
          time: mealTime[i] || 'ไม่ระบุ'
        }))
      }
    ]
    await addDoc(collection(db, 'recommend_logs'), {
      email: user.email,
      resultData,
      type: 'daily',
      timestamp: serverTimestamp()
    })
  }

  await loadRecipesIndex()
  attachRecipeIds()
  if (user?.email) await loadUserLikes(user.email)
})
</script>

<style scoped>
/* ใช้ Tailwind */
</style>
