<template>
  <div class="settings-container">
    <h2>⚙️ ตั้งค่าผู้ใช้</h2>

    <!-- รูปโปรไฟล์ -->
    <div class="section">
      <label>อัปโหลดรูปโปรไฟล์:</label>
      <input type="file" accept="image/*" @change="handleFileUpload" />
      <div v-if="avatarUrl">
        <p>🎉 แสดงรูปโปรไฟล์:</p>
        <img :src="avatarUrl" alt="Avatar" class="avatar-preview" />
      </div>
    </div>

    <!-- เปลี่ยนชื่อแสดง -->
    <div class="section">
      <label>ชื่อที่แสดง:</label>
      <input v-model="displayName" type="text" placeholder="กรอกชื่อของคุณ..." />
    </div>

    <!-- bio -->
    <div class="section">
      <label>ข้อมูลเกี่ยวกับตัวคุณ (bio):</label>
      <textarea v-model="bio" placeholder="เช่น: ชอบทำอาหารคลีน..."></textarea>
    </div>

    <button @click="saveProfile">บันทึกข้อมูลโปรไฟล์</button>

    <!-- ล้างเมนูที่เคยกดหัวใจ -->
    <div class="section">
      <p>🗑 ล้างเมนูที่คุณเคยกดหัวใจ</p>
      <button @click="clearLikedMenus">ล้าง ❤️ ทั้งหมด</button>
    </div>

    <!-- เปลี่ยนธีม -->
    <div class="section">
      <p>🌗 ธีมปัจจุบัน: <strong>{{ theme }}</strong></p>
      <button @click="toggleTheme">เปลี่ยนธีม</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const displayName = ref('')
const bio = ref('')
const theme = ref('light')
const avatarUrl = ref('')
const userEmail = ref('')

const applyTheme = () => {
  document.body.className = theme.value
}

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'light'
  applyTheme()

  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userEmail.value = user.email
      const userDoc = await getDoc(doc(db, 'users', user.email))
      if (userDoc.exists()) {
        const data = userDoc.data()
        displayName.value = data.displayName || ''
        bio.value = data.bio || ''
        avatarUrl.value = data.avatarUrl || ''
      }
    }
  })
})

const saveProfile = async () => {
  console.log('✅ saveProfile ถูกเรียก')

  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    console.warn('❌ ไม่มีผู้ใช้ login อยู่')
    return alert('ยังไม่ได้ login')
  }

  const email = user.email
  console.log('📧 email:', email)
  console.log('📛 displayName:', displayName.value)
  console.log('📝 bio:', bio.value)
  console.log('🖼 avatarUrl:', avatarUrl.value)

  try {
    await setDoc(doc(db, 'users', email), {
      displayName: displayName.value,
      bio: bio.value,
      avatarUrl: avatarUrl.value,
      email: email,
      updatedAt: serverTimestamp()
    }, { merge: true })

    alert('✅ บันทึกข้อมูลโปรไฟล์เรียบร้อย')
  } catch (err) {
    console.error('❌ setDoc error:', err)
    alert('❌ เกิดข้อผิดพลาดในการบันทึก')
  }
}

const clearLikedMenus = () => {
  localStorage.removeItem('likedMenus')
  alert('🗑 ลบเมนูที่กด ❤️ แล้ว')
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  applyTheme()
  alert(`🌈 เปลี่ยนธีมเป็น ${theme.value}`)
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file || !userEmail.value) return

  const storage = getStorage()
  const storagePath = `avatars/${userEmail.value}`
  const fileRef = storageRef(storage, storagePath)

  await uploadBytes(fileRef, file)
  avatarUrl.value = await getDownloadURL(fileRef)
  alert('📸 รูปถูกอัปโหลดเรียบร้อย')
}
</script>

<style scoped>
.settings-container {
  max-width: 600px;
  margin: 2rem auto;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  font-family: sans-serif;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.section {
  margin-bottom: 1.5rem;
}

input,
textarea {
  width: 100%;
  padding: 0.6rem;
  margin-top: 0.3rem;
  margin-bottom: 0.6rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  margin-top: 0.5rem;
  border: 2px solid #ccc;
}

button {
  padding: 0.5rem 1rem;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:hover {
  background: #5548c8;
}
</style>
