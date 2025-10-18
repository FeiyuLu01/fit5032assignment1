<!-- Firebase Auth sign-in screen (BR D.1 external authentication) -->
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

        <div class="text-center my-3 text-muted d-flex align-items-center gap-3">
          <hr class="flex-fill" />
          <span class="small text-uppercase">or</span>
          <hr class="flex-fill" />
        </div>

        <button
          type="button"
          class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          :disabled="loadingGoogle"
          @click="signinWithGoogle"
        >
          <span class="spinner-border spinner-border-sm" v-if="loadingGoogle"></span>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.35 11.1h-9.44v2.95h5.43c-.24 1.4-1.48 4.12-5.43 4.12a5.95 5.95 0 0 1 0-11.9 5.35 5.35 0 0 1 3.77 1.48l2.57-2.48A9.15 9.15 0 0 0 11.91 2 9.91 9.91 0 0 0 2 11.91 9.91 9.91 0 0 0 11.91 21.8c5.73 0 9.48-4 9.48-9.64a8.43 8.43 0 0 0-.04-1.06Z"/>
          </svg>
          Continue with Google
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
  import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
  import { doc, getDoc, serverTimestamp } from 'firebase/firestore'
  import { auth, db } from '@/services/firebase'
  import { useAuthState } from '@/state/authState'

  const email = ref('')
  const password = ref('')
  const selectedRole = ref('user')
  const loading = ref(false)
  const loadingGoogle = ref(false)
  const errorMsg = ref('')
  const infoMsg = ref('')
  const router = useRouter()
  const { ensureUserDoc } = useAuthState()
  
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

  async function signinWithGoogle() {
    errorMsg.value = ''
    infoMsg.value = ''
    loadingGoogle.value = true
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const cred = await signInWithPopup(auth, provider)
      const user = cred.user

      // Ensure Firestore profile exists with default role
      await ensureUserDoc(user.uid, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        lastLoginAt: serverTimestamp()
      })

      infoMsg.value = `Welcome ${user.email}`
      router.push('/')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg.value = 'Google sign-in popup closed before completion.'
      } else {
        errorMsg.value = err.message || 'Google sign-in failed.'
      }
    } finally {
      loadingGoogle.value = false
    }
  }
  </script>
