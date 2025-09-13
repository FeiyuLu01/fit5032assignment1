<!-- src/views/FirebaseSigninView.vue -->
<template>
    <div class="container py-4" style="max-width:560px;">
      <h2 class="mb-3">Sign in</h2>
      <form @submit.prevent="signin" novalidate class="needs-validation">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input
            type="email"
            class="form-control"
            required
            v-model.trim="email"
            placeholder="your@email.com"
          />
        </div>
  
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            required
            minlength="6"
            v-model="password"
            placeholder="Your password"
          />
        </div>
  
        <div class="mb-3">
          <label class="form-label">Login as</label>
          <select class="form-select" v-model="selectedRole">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
  
        <button class="btn btn-primary w-100" :disabled="loading">
          <span class="spinner-border spinner-border-sm me-2" v-if="loading"></span>
          Sign in
        </button>
  
        <p class="mt-3 mb-0">
          No account yet?
          <router-link to="/register">Create one</router-link>
        </p>
  
        <div class="alert alert-danger mt-3" v-if="errorMsg">{{ errorMsg }}</div>
        <div class="alert alert-info mt-3" v-if="infoMsg">{{ infoMsg }}</div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { signInWithEmailAndPassword } from 'firebase/auth'
  import { doc, getDoc } from 'firebase/firestore'
  import { auth, db } from '@/services/firebase'
  
  const email = ref('')
  const password = ref('')
  const selectedRole = ref('user')
  const loading = ref(false)
  const errorMsg = ref('')
  const infoMsg = ref('')
  const router = useRouter()
  
  async function signin() {
    errorMsg.value = ''
    infoMsg.value = ''
    loading.value = true
    try {
      const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
      const user = cred.user
  
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        throw new Error('No user profile found in Firestore.')
      }
      const data = snap.data()
      const actualRole = data.role || 'user'
  
      if (actualRole !== selectedRole.value) {
        throw new Error(`Role mismatch: this account is '${actualRole}', not '${selectedRole.value}'.`)
      }
  
      infoMsg.value = `Welcome ${user.email} as ${actualRole}`
      router.push('/')
    } catch (err) {
      console.error(err)
      errorMsg.value = err.message || 'Sign in failed'
    } finally {
      loading.value = false
    }
  }
  </script>