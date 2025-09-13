// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CourtFinderView from '../views/CourtFinderView.vue'
import CourtDetailsView from '../views/CourtDetailsView.vue'

import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import AdminView from '../views/AdminView.vue'

import { useAuthState } from '@/state/authState'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/courts', name: 'courts', component: CourtFinderView },
  { path: '/courts/:id', name: 'courtDetails', component: CourtDetailsView, props: true },

  { path: '/login', name: 'login', component: FirebaseSigninView },
  { path: '/register', name: 'register', component: FirebaseRegisterView },

  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { state } = useAuthState()

  if (!state.ready) {
    const stop = router.afterEach(() => {}) 
    await Promise.resolve()
    stop()
  }

  const needAuth = to.meta?.requiresAuth === true
  if (!needAuth && !to.meta?.roles) {
    return next()
  }

  if (!state.user) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  const roles = to.meta?.roles
  if (Array.isArray(roles) && roles.length > 0) {
    if (!state.role || !roles.includes(state.role)) {
      return next({ name: 'home' })
    }
  }

  next()
})

export default router