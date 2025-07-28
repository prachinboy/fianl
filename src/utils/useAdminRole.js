// ✅ แก้ไขแล้ว ทำงานทันทีโดยไม่รอ onMounted
import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

export function useAdminRole() {
  const isAdmin = ref(false)
  const loading = ref(true)

  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        isAdmin.value = data.role === 'admin'
      }
    }
    loading.value = false
  })

  return { isAdmin, loading }
}
