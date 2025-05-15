import { createRouter, createWebHistory } from 'vue-router'
import SignUp from '../pages/SignUp.vue'
import Login from '../pages/Login.vue'
import MenuSelection from '../pages/MenuSelection.vue' // หน้าเลือกเมนู
import WeeklyRecommendation from '../pages/WeeklyRecommendation.vue' // หน้าแนะนำเมนูอาหารรายสัปดาห์
import RandomMenu from '../pages/RandomMenu.vue' // หน้าเมนูสุ่ม
import Dashboard from '../pages/Dashboard.vue'

const routes = [
  { path: '/signup', component: SignUp },
  { path: '/login', component: Login },
  { path: '/menu-selection', component: MenuSelection },
  { path: '/weekly-recommendation', component: WeeklyRecommendation },
  { path: '/random-menu', component: RandomMenu },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('user') // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้ว
  if (to.meta.requiresAuth && !loggedIn) {
    next('/login') // ถ้ายังไม่ได้เข้าสู่ระบบก็ให้ไปหน้า Login
  } else {
    next() // ถ้าผ่านการตรวจสอบก็ให้ไปที่หน้าเป้าหมาย
  }
})

export default router
