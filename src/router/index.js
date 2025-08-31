import { createRouter, createWebHashHistory } from 'vue-router'

import AddMenu from '@/pages/AddMenu.vue'
import SignUp from '../pages/SignUp.vue'
import Login from '../pages/Login.vue'
import MenuSelection from '../pages/MenuSelection.vue'
import WeeklyRecommendation from '../views/WeeklyRecommendation.vue'
import RandomMenu from '../pages/RandomMenu.vue'
import Dashboard from '../pages/Dashboard.vue'
import MenuResult from '../pages/MenuResult.vue'
import Settings from '@/pages/Settings.vue'
import Home from '@/pages/Home.vue'

const SearchRecipe = () => import('@/views/SearchRecipe.vue')

const routes = [
  { path: '/', redirect: '/signup' },
  { path: '/signup', component: SignUp },
  { path: '/login', component: Login },
  { path: '/menu-selection', component: MenuSelection },
  { path: '/weekly-recommendation', component: WeeklyRecommendation },
  { path: '/random-menu', component: RandomMenu },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/menu-result', component: MenuResult },
  { path: '/admin/add-menu', component: AddMenu },
  { path: '/settings', component: Settings },
  { path: '/search', component: SearchRecipe },
  { path: '/home', component: Home },
  { path: '/history', component: () => import('../pages/RecommendationHistory.vue') },

  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/pages/admin/AdminDashboard.vue'),
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/pages/admin/AdminUsers.vue'),
  },
  {
    path: '/admin/menus',
    name: 'AdminMenus',
    component: () => import('@/pages/admin/AdminMenus.vue')
  },
  {
    path: '/admin/stats',
    name: 'AdminStats',
    component: () => import('@/pages/admin/AdminStats.vue')
  },

  // ✅ เพิ่มหน้า Account Suspended
  {
    path: '/account-suspended',
    name: 'AccountSuspended',
    component: () => import('@/views/AccountSuspended.vue')
  },
  {
  path: '/daily-recommendation',
  name: 'DailyRecommendation',
  component: () => import('@/views/DailyRecommendation.vue')
},
{
  path: '/daily-menu-result',
  name: 'DailyMenuResult',
  component: () => import('@/views/DailyMenuResult.vue')
}

]

const router = createRouter({
  history: createWebHashHistory(), // ใช้ hash mode (#)
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