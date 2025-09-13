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
  
        <div class="mb-3">
          <label class="form-label">Role (demo purpose)</label>
          <select class="form-select" v-model="role">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <div class="form-text text-warning">
            For demo only: picking <code>admin</code> here is just to show role-based pages.
          </div>
        </div>
  
        <button class="btn btn-primary w-100" :disabled="loading">
          <span class="spinner-border spinner-border-sm me-2" v-if="loading"></span>
          Register
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
  import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
  import { auth, db } from '@/services/firebase'
  
  // ⛳️ 重要：注册成功后，立刻写入 Firestore 的 users/{uid} 文档。
  // 这样 Firestore 控制台就能看到数据了（前提是规则允许：开发阶段建议 request.auth != null）
  
  const router = useRouter()
  
  const email = ref('')
  const password = ref('')
  const role = ref('user')
  const loading = ref(false)
  const errorMsg = ref('')
  const okMsg = ref('')
  
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
  
      // 2) 可选：给用户设置一个 displayName（这里用邮箱前缀）
      const displayName = email.value.split('@')[0]
      try {
        await updateProfile(user, { displayName })
      } catch (_) {}
  
      // 3) **关键**：写入 Firestore users/{uid} 文档（演示允许从前端写入）
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName,
        role: role.value || 'user',
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
  </script>