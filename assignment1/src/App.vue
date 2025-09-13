<template>
  <div>
    <!-- Bootstrap Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <router-link class="navbar-brand" to="/">NFP App</router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="mainNav" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0" v-if="auth.user">
            <li class="nav-item">
              <router-link class="nav-link" to="/" exact>Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/courts">Court Finder</router-link>
            </li>
            <!-- 仅 admin 可见的菜单 -->
            <li class="nav-item" v-if="auth.role === 'admin'">
              <router-link class="nav-link" to="/admin">Admin</router-link>
            </li>
          </ul>

          <!-- 右侧用户区 -->
          <ul class="navbar-nav ms-auto">
            <li class="nav-item" v-if="!auth.user">
              <router-link class="nav-link" to="/login">Login</router-link>
            </li>
            <li class="nav-item" v-if="!auth.user">
              <router-link class="nav-link" to="/register">Register</router-link>
            </li>

            <li class="nav-item dropdown" v-if="auth.user">
              <a
                class="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {{ auth.user?.email }} <span class="badge bg-secondary">{{ auth.role }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <button class="dropdown-item" @click="signout">Sign out</button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Page -->
    <router-view />
  </div>
</template>

<script setup>
import { signOut } from 'firebase/auth'
import { auth as fbAuth } from '@/services/firebase'
import { useAuthState } from '@/state/authState'
import { useRouter } from 'vue-router'

const { state: auth } = useAuthState()
const router = useRouter()

async function signout() {
  try {
    await signOut(fbAuth)
  } finally {
    // 立刻带到登录页（满足“Sign out 后自动进入登录页面”）
    router.push('/login')
  }
}
</script>

<style scoped>
.fade-in {
  animation: fadein .5s ease-out;
}
@keyframes fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

.custom-link.active {
  color: var(--bs-primary) !important;
  font-weight: 600;
  border-bottom: 3px solid var(--bs-primary);
  padding-bottom: 4px;
}
</style>