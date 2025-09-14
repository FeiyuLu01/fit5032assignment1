// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CourtFinderView from '../views/CourtFinderView.vue'
import CourtDetailsView from '../views/CourtDetailsView.vue'

import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import AdminView from '../views/AdminDashboard.vue'

import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useAuthState } from '@/state/authState'

const routes = [
  // user front
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/courts', name: 'courts', component: CourtFinderView, meta: { requiresAuth: true } },
  { path: '/courts/:id', name: 'courtDetails', component: CourtDetailsView, props: true, meta: { requiresAuth: true } },

  // auth
  { path: '/login', name: 'login', component: FirebaseSigninView },
  { path: '/register', name: 'register', component: FirebaseRegisterView },

  // admin (single component with tabs)
  { path: '/admin',               name: 'admin',              component: AdminView, meta: { requiresAuth: true, roles: ['admin'], tab: 'courts' } },
  { path: '/admin/create',        name: 'adminCreateCourt',   component: AdminView, meta: { requiresAuth: true, roles: ['admin'], tab: 'create' } },
  { path: '/admin/announcements', name: 'adminAnnouncements', component: AdminView, meta: { requiresAuth: true, roles: ['admin'], tab: 'announcements' } },

  // optional 404 fallback
  // { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// wait until Firebase Auth state resolved
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
  const isAuthed = !!state.user
  const isAdmin = state.role === 'admin'

  // must login for protected pages
  if (to.meta.requiresAuth && !isAuthed) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // if already logged in, prevent visiting login/register
  if ((to.name === 'login' || to.name === 'register') && isAuthed) {
    return next({ name: isAdmin ? 'admin' : 'home' })
  }

  // admin visiting user front pages -> redirect to dashboard
  if (isAdmin && (to.name === 'home' || to.name === 'courts' || to.name === 'courtDetails')) {
    return next({ name: 'admin' })
  }

  // check role requirements
  const roles = to.meta?.roles
  if (Array.isArray(roles) && roles.length > 0) {
    if (!isAdmin && roles.includes('admin')) {
      return next({ name: 'home' })
    }
  }

  next()
})

export default router