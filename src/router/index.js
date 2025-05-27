import { createRouter, createWebHashHistory } from 'vue-router'

import AddMenu from '@/pages/AddMenu.vue'
import SignUp from '../pages/SignUp.vue'
import Login from '../pages/Login.vue'
import MenuSelection from '../pages/MenuSelection.vue'
import WeeklyRecommendation from '../views/WeeklyRecommendation.vue'
import RandomMenu from '../pages/RandomMenu.vue'
import Dashboard from '../pages/Dashboard.vue'
import MenuResult from '../pages/MenuResult.vue'

const routes = [
  { path: '/', redirect: '/signup' },
  { path: '/signup', component: SignUp },
  { path: '/login', component: Login },
  { path: '/menu-selection', component: MenuSelection },
  { path: '/weekly-recommendation', component: WeeklyRecommendation },
  { path: '/random-menu', component: RandomMenu },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/menu-result', component: MenuResult },
  { path: '/admin/add-menu', component: AddMenu }
]

const router = createRouter({
  history: createWebHashHistory(), // ✅ เปลี่ยนตรงนี้
  routes
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
