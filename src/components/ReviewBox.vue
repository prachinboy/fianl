<template>
  <div class="review-box">
    <h4 class="review-title">รีวิว</h4>
    <form @submit.prevent="submitReview" class="review-form">
      <textarea v-model="comment" placeholder="ความคิดเห็น..." required></textarea>
      <select v-model="rating" required>
        <option disabled value="">ให้คะแนน</option>
        <option v-for="n in 5" :key="n" :value="n">{{ n }} ⭐</option>
      </select>
      <button type="submit">ส่ง</button>
    </form>
    <div v-if="reviews.length" class="reviews-list">
      <div v-for="(review, index) in reviews" :key="index" class="review-item">
        <p><strong>{{ review.username }}</strong>: {{ review.comment }} ({{ review.rating }} ⭐)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const props = defineProps({ menuName: String })

const comment = ref('')
const rating = ref('')
const reviews = ref([])

const loadReviews = async () => {
  const q = query(collection(db, 'reviews'), where('menuName', '==', props.menuName))
  const snapshot = await getDocs(q)
  reviews.value = snapshot.docs.map(doc => doc.data())
}

onMounted(loadReviews)

const submitReview = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    alert('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น')
    return
  }

  await addDoc(collection(db, 'reviews'), {
    menuName: props.menuName,
    username: user.email.split('@')[0],
    comment: comment.value,
    rating: Number(rating.value),
    timestamp: serverTimestamp()
  })

  comment.value = ''
  rating.value = ''
  await loadReviews()
}
</script>

<style scoped>
.review-box {
  margin-top: 0.25rem;
  padding: 0.4rem;
  background: #f8f8f8;
  border-radius: 4px;
  font-size: 0.7rem;
  max-height: 165px;
  overflow-y: auto;
}

textarea,
select {
  font-size: 0.80rem;
  padding: 0.2rem;
  margin-bottom: 0.2rem;
  width: 100%;
}

button {
  font-size: 0.80rem;
  padding: 0.2rem 0.5rem;
  margin-top: 0.2rem;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.review-title {
  font-size: 0.80rem;
  margin-bottom: 0.25rem;
}

.review-item {
  font-size: 0.80rem;
  margin-bottom: 0.2rem;
}
</style>
