// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CourtFinderView from '../views/CourtFinderView.vue'
import CourtDetailsView from '../views/CourtDetailsView.vue'

import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import AdminView from '../views/AdminView.vue'

import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useAuthState } from '@/state/authState'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/courts', name: 'courts', component: CourtFinderView, meta: { requiresAuth: true } },
  { path: '/courts/:id', name: 'courtDetails', component: CourtDetailsView, props: true, meta: { requiresAuth: true } },

  { path: '/login', name: 'login', component: FirebaseSigninView },
  { path: '/register', name: 'register', component: FirebaseRegisterView },

  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 用于等待 Firebase 初始化完成再放行路由
let authResolved = false
function waitForAuth() {
  return new Promise((resolve) => {
    if (authResolved) return resolve()
    const auth = getAuth()
    onAuthStateChanged(auth, (user) => {
      const { state } = useAuthState()
      state.user = user
      state.role = user ? state.role || 'user' : null
      state.ready = true
      authResolved = true
      resolve()
    })
  })
}

router.beforeEach(async (to, from, next) => {
  await waitForAuth()
  const { state } = useAuthState()

  // 如果未登录用户访问需要认证的页面 → 去登录
  if (to.meta.requiresAuth && !state.user) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 如果已登录用户访问登录页 → 跳过，直接回主页
  if (to.name === 'login' && state.user) {
    return next({ name: 'home' })
  }

  // 检查角色
  const roles = to.meta?.roles
  if (Array.isArray(roles) && roles.length > 0) {
    if (!state.role || !roles.includes(state.role)) {
      return next({ name: 'home' })
    }
  }

  next()
})

export default router