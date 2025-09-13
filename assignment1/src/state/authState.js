import { reactive } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'

const LS_KEY = 'auth_basic_v1'

const state = reactive({
  ready: false,        
  user: null,          // Firebase User or null
  role: null           // 'user' | 'admin' | null
})

function saveLS() {
  try {
    const snapshot = state.user
      ? { uid: state.user.uid, email: state.user.email, role: state.role }
      : null
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot))
  } catch {}
}

function loadLS() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const cached = JSON.parse(raw)
    if (cached && cached.role) {
      state.role = cached.role
    }
  } catch {}
}

loadLS()

async function fetchUserRole(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data()
    state.role = data.role || 'user'
  } else {
    await setDoc(ref, { role: 'user' }, { merge: true })
    state.role = 'user'
  }
  saveLS()
}

function watchFirebaseAuth() {
  onAuthStateChanged(auth, async (user) => {
    state.user = user
    if (user) {
      await fetchUserRole(user.uid)
    } else {
      state.role = null
      saveLS()
    }
    state.ready = true
  })
}

async function ensureUserDoc(uid, payload = {}) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { role: 'user', ...payload }, { merge: true })
}

export function useAuthState() {
  if (!state.ready) {
    
    watchFirebaseAuth()
  }
  return {
    state,
    ensureUserDoc
  }
}