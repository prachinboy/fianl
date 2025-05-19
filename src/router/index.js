import { createRouter, createWebHistory } from 'vue-router'
import SignUp from '../pages/SignUp.vue'
import Login from '../pages/Login.vue'
import MenuSelection from '../pages/MenuSelection.vue'
import WeeklyRecommendation from '../views/WeeklyRecommendation.vue' // ✅ ใช้ของที่แก้อยู่
import RandomMenu from '../pages/RandomMenu.vue'
import Dashboard from '../pages/Dashboard.vue'
import MenuResult from '../pages/MenuResult.vue' // ✅ เพิ่มหน้านี้
import WeeklyAlgoView from '../views/WeeklyRecommendation.vue'

const routes = [
  { path: '/signup', component: SignUp },
  { path: '/login', component: Login },
  { path: '/menu-selection', component: MenuSelection },
  { path: '/weekly-recommendation', component: WeeklyRecommendation },
  { path: '/random-menu', component: RandomMenu },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/weekly', component: WeeklyAlgoView },

  // ✅ เพิ่ม route สำหรับหน้าแสดงผลลัพธ์เมนู
  { path: '/menu-result', component: MenuResult }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('user')
  if (to.meta.requiresAuth && !loggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
