<!-- src/views/FirebaseRegisterView.vue -->
<template>
    <div class="container py-4" style="max-width:560px;">
      <h2 class="mb-3">Create an Account</h2>
  
      <form @submit.prevent="register" novalidate class="needs-validation">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input
            type="email"
            class="form-control"
            required
            v-model.trim="email"
            placeholder="your@email.com"
          />
          <div class="form-text">Use a valid email address.</div>
        </div>
  
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            required
            minlength="6"
            v-model="password"
            placeholder="At least 6 characters"
          />
        </div>
  
        <!-- 角色选择已移除：所有新用户固定写入 role: 'user' -->

        <button class="btn btn-primary w-100" :disabled="loading">
          <span class="spinner-border spinner-border-sm me-2" v-if="loading"></span>
          Register
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
          @click="registerWithGoogle"
        >
          <span class="spinner-border spinner-border-sm" v-if="loadingGoogle"></span>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.35 11.1h-9.44v2.95h5.43c-.24 1.4-1.48 4.12-5.43 4.12a5.95 5.95 0 0 1 0-11.9 5.35 5.35 0 0 1 3.77 1.48l2.57-2.48A9.15 9.15 0 0 0 11.91 2 9.91 9.91 0 0 0 2 11.91 9.91 9.91 0 0 0 11.91 21.8c5.73 0 9.48-4 9.48-9.64a8.43 8.43 0 0 0-.04-1.06Z"/>
          </svg>
          Continue with Google
        </button>
  
        <p class="mt-3 mb-0">
          Already have an account?
          <router-link to="/login">Sign in</router-link>
        </p>
  
        <div class="alert alert-danger mt-3" v-if="errorMsg">{{ errorMsg }}</div>
        <div class="alert alert-success mt-3" v-if="okMsg">{{ okMsg }}</div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth'
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
  import { auth, db } from '@/services/firebase'
  import { useAuthState } from '@/state/authState'

  const router = useRouter()

  const email = ref('')
  const password = ref('')
  const loading = ref(false)
  const loadingGoogle = ref(false)
  const errorMsg = ref('')
  const okMsg = ref('')
  const { ensureUserDoc } = useAuthState()
  
  function mapFirebaseAuthError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered. Please sign in instead.'
      case 'auth/invalid-email': return 'Invalid email format.'
      case 'auth/weak-password': return 'Password should be at least 6 characters.'
      default: return 'Register failed. (' + code + ')'
    }
  }
  
  async function register() {
    errorMsg.value = ''
    okMsg.value = ''
    loading.value = true
    try {
      // 1) 注册 Auth 账号
      const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)
      const user = cred.user
  
      // 2) 可选：设置 displayName（这里用邮箱前缀）
      const displayName = email.value.split('@')[0]
      try {
        await updateProfile(user, { displayName })
      } catch (_) {}
  
      // 3) 固定写入 Firestore：role 永远是 'user'
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        role: 'user',
        createdAt: serverTimestamp()
      }, { merge: true })
  
      okMsg.value = 'Register successfully!'
      router.push('/')
    } catch (err) {
      console.error(err)
      errorMsg.value = mapFirebaseAuthError(err?.code || '')
    } finally {
      loading.value = false
    }
  }

  async function registerWithGoogle() {
    errorMsg.value = ''
    okMsg.value = ''
    loadingGoogle.value = true
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const cred = await signInWithPopup(auth, provider)
      const user = cred.user

      await ensureUserDoc(user.uid, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        role: 'user',
        createdAt: serverTimestamp()
      })

      okMsg.value = 'Welcome! Your Google account is now linked.'
      router.push('/')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg.value = 'Google popup closed before completion.'
      } else {
        errorMsg.value = err.message || 'Google registration failed.'
      }
    } finally {
      loadingGoogle.value = false
    }
  }
  </script>
