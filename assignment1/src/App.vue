<!-- src/App.vue -->
<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-custom">
      <div class="container">
        <router-link class="navbar-brand fw-semibold" to="/">Basketball Hub</router-link>

        <button
          class="navbar-toggler"
          type="button"
          @click="navOpen = !navOpen"
          aria-controls="mainNav"
          :aria-expanded="navOpen ? 'true' : 'false'"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="mainNav" class="collapse navbar-collapse" :class="{ show: navOpen }">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0" v-if="auth.user">
            <template v-if="auth.role !== 'admin'">
              <li class="nav-item">
                <router-link class="nav-link" to="/" exact>Home</router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link" to="/courts">Court Finder</router-link>
              </li>
            </template>
            <template v-else>
              <li class="nav-item">
                <router-link class="nav-link" to="/admin">Dashboard</router-link>
              </li>
            </template>
          </ul>

          <ul class="navbar-nav ms-auto">
            <li class="nav-item" v-if="!auth.user">
              <router-link class="nav-link" to="/login">Login</router-link>
            </li>
            <li class="nav-item" v-if="!auth.user">
              <router-link class="nav-link" to="/register">Register</router-link>
            </li>

            <li class="nav-item position-relative" v-if="auth.user">
              <button
                type="button"
                class="nav-link btn btn-link p-0 nav-user-toggle d-inline-flex align-items-center"
                :aria-expanded="menuOpen ? 'true' : 'false'"
                aria-haspopup="menu"
                @click="toggleMenu"
                @keydown.down.prevent="openMenu"
                @keydown.enter.prevent="openMenu"
                @keydown.escape.prevent="closeMenu"
              >
                {{ auth.user?.email }}
                <span class="badge bg-secondary text-uppercase ms-2">{{ auth.role }}</span>
                <svg class="ms-2 caret" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              <div
                v-show="menuOpen"
                class="user-menu shadow-lg"
                role="menu"
                @keydown.escape.prevent="closeMenu"
              >
                <span class="menu-arrow" />

                <div class="menu-header">
                  <div class="avatar">{{ initials }}</div>
                  <div class="info">
                    <div class="email" :title="auth.user?.email">{{ auth.user?.email }}</div>
                    <span class="role badge rounded-pill text-bg-secondary">{{ auth.role }}</span>
                  </div>
                </div>

                <hr class="menu-divider" />

                <button class="menu-item danger" role="menuitem" @click="signout">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M16 13v-2H7V8l-5 4l5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </nav>

    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { signOut } from 'firebase/auth'
import { auth as fbAuth } from '@/services/firebase'
import { useAuthState } from '@/state/authState'
import { useRouter } from 'vue-router'

const { state: auth } = useAuthState()
const router = useRouter()

const navOpen = ref(false)
const menuOpen = ref(false)
const initials = computed(() => {
  const email = auth.user?.email || ''
  const name = email.split('@')[0] || 'U'
  return name.slice(0, 2).toUpperCase()
})

function toggleMenu() { menuOpen.value = !menuOpen.value }
function openMenu()   { menuOpen.value = true }
function closeMenu()  { menuOpen.value = false }

function onDocClick(e) {
  const trigger = document.querySelector('.nav-user-toggle')
  const menu = document.querySelector('.user-menu')
  if (!trigger || !menu) return
  if (trigger.contains(e.target) || menu.contains(e.target)) return
  closeMenu()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

async function signout() {
  try {
    await signOut(fbAuth)
  } finally {
    closeMenu()
    router.push('/login')
  }
}
</script>

<style>
.navbar-custom {
  position: sticky;
  top: 0;
  z-index: 1030;
  background-color: #eaf4ff; /* 浅蓝 */
  border-bottom: 1px solid rgba(0,0,0,.06);
}

.navbar-custom .navbar-brand,
.navbar-custom .nav-link {
  color: #0b3d6b;
}
.navbar-custom .nav-link:hover { color: #094b8a; }

.navbar-custom .nav-link.router-link-active,
.navbar-custom .nav-link.router-link-exact-active {
  color: #0a58ca;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
}

.nav-user-toggle { text-decoration: none; color: #0b3d6b; }
.nav-user-toggle .caret { transition: transform .15s ease; }
.nav-user-toggle[aria-expanded="true"] .caret { transform: rotate(180deg); }

.user-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 280px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 12px;
  z-index: 1100;
  padding: 10px 0 8px;
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.08),
    0 2px 6px rgba(15, 23, 42, 0.06);
}

.user-menu .menu-arrow {
  position: absolute;
  right: 16px;
  top: -8px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-left: 1px solid rgba(0,0,0,.08);
  border-top: 1px solid rgba(0,0,0,.08);
  transform: rotate(45deg);
}

.menu-header {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 10px;
  padding: 12px 14px 4px;
  align-items: center;
}
.menu-header .avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: #0a58ca;
  color: #fff;
  display: grid; place-items: center;
  font-weight: 700;
  letter-spacing: .5px;
}
.menu-header .info .email {
  font-size: .92rem;
  line-height: 1.1;
  color: #0b3d6b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-header .role {
  margin-top: 4px;
  font-size: .7rem;
  letter-spacing: .8px;
}

.menu-divider {
  margin: 10px 0 6px;
  border-color: rgba(0,0,0,.08);
}

.menu-item {
  width: 100%;
  background: transparent;
  border: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: #0b3d6b;
  text-align: left;
  font-weight: 500;
  transition: background .12s ease, color .12s ease, transform .02s;
}
.menu-item:hover {
  background: #f1f5ff;
  color: #073b73;
}
.menu-item:active { transform: translateY(1px); }
.menu-item svg { flex: 0 0 auto; }

.menu-item.danger {
  color: #c0272b;
}
.menu-item.danger:hover {
  background: #fff1f1;
  color: #a1191c;
}

.navbar-custom .navbar-toggler { border-color: rgba(0,0,0,.15); }
.navbar-custom .navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(11,61,107, 0.8)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}
</style>