<template>
  <section v-if="court" class="container py-4">
    <!-- Title + Favourite -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
      <h2 class="fw-bold text-primary m-0">{{ court.name }}</h2>
      <button
        class="btn btn-sm"
        :class="isFaved ? 'btn-warning' : 'btn-outline-secondary'"
        @click="toggleFav"
      >
        {{ isFaved ? '★ Favourited' : '☆ Favourite' }}
      </button>
    </div>

    <!-- Info + Map -->
    <div class="row g-4">
      <!-- Info -->
      <div class="col-12 col-lg-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body">
            <p class="mb-2"><strong>Suburb:</strong> {{ court.suburb }}</p>
            <p class="mb-2"><strong>Type:</strong> {{ court.indoor ? 'Indoor' : 'Outdoor' }}</p>
            <p class="mb-2"><strong>Cost:</strong> {{ court.cost }}</p>
            <p class="mb-2"><strong>Hours:</strong> {{ court.hours }}</p>
            <p class="mb-0"><strong>Surface:</strong> {{ court.surfaces.join(', ') }}</p>
          </div>
        </div>
      </div>

      <!-- Map placeholder -->
      <div class="col-12 col-lg-6">
        <div class="ratio ratio-16x9 border rounded bg-light position-relative">
          <iframe
            title="Map preview"
            src="about:blank"
            style="position:absolute; inset:0; width:100%; height:100%; border:0; border-radius:.5rem;"
          ></iframe>
          <div class="position-absolute top-50 start-50 translate-middle text-muted">
            Map Preview
          </div>
        </div>
      </div>
    </div>

    <!-- Ratings -->
    <div class="mt-5">
      <h4 class="fw-bold mb-3">Ratings</h4>

      <!-- Average block -->
      <div class="d-flex align-items-center gap-3 mb-2">
        <div class="fs-4 fw-semibold">{{ avgDisplay }}</div>
        <div class="d-inline-flex align-items-center">
          <span
            v-for="i in 5"
            :key="'avg-'+i"
            class="me-1"
            :class="i <= roundedAvg ? 'text-warning' : 'text-secondary'"
            aria-hidden="true"
          >★</span>
        </div>
        <div class="text-muted small">({{ count }} ratings)</div>
      </div>

      <!-- Your rating -->
      <div class="mt-4">
        <div class="fw-semibold mb-2">Your rating</div>
        <div class="d-inline-flex align-items-center">
          <button
            v-for="i in 5"
            :key="'mine-'+i"
            type="button"
            class="btn btn-link p-0 me-2 star-btn"
            :aria-label="'Rate ' + i"
            @click="rate(i)"
          >
            <span :class="i <= myRating ? 'text-warning' : 'text-secondary'">★</span>
          </button>
        </div>
        <div v-if="myRating" class="text-muted small mt-1">You rated: {{ myRating }}/5</div>
        <div v-if="err" class="text-danger small mt-2">{{ err }}</div>
      </div>
    </div>
  </section>

  <div v-else class="text-muted text-center py-5">Loading…</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchCourtById } from '../services/data'
import { useAppState } from '../state/appState'

/* Firestore + Auth for ratings */
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const app = useAppState()
const court = ref(null)

/* Load court */
onMounted(async () => {
  app.init()
  court.value = await fetchCourtById(route.params.id)
  if (court.value) {
    startRatingsListeners(court.value.id)
    loadMyRating(court.value.id)
  }
})

/* Favourite state */
const isFaved = computed(() => (court.value ? app.isFaved(court.value.id) : false))
function toggleFav() {
  if (court.value) app.toggleFave(court.value.id)
}

/* ---------- Ratings state ---------- */
const db = getFirestore()
const auth = getAuth()

const avg = ref(0)
const count = ref(0)
const myRating = ref(0)
const err = ref('')

/* Derived display values */
const roundedAvg = computed(() => Math.round(avg.value))
const avgDisplay = computed(() => (count.value ? avg.value.toFixed(1) : '0.0'))

let unsub = null

/* Listen to ratings collection to compute average */
function startRatingsListeners(courtId) {
  stopRatingsListeners()
  const col = collection(db, 'courts', courtId, 'ratings')
  unsub = onSnapshot(
    col,
    (snap) => {
      let sum = 0
      let c = 0
      snap.forEach((d) => {
        const v = Number(d.data()?.value || 0)
        if (v > 0) {
          sum += v
          c++
        }
      })
      count.value = c
      avg.value = c ? sum / c : 0
    },
    (e) => {
      console.error(e)
      err.value = 'Failed to load ratings.'
    }
  )
}

function stopRatingsListeners() {
  if (typeof unsub === 'function') {
    unsub()
    unsub = null
  }
}

onBeforeUnmount(stopRatingsListeners)

/* Load current user's rating */
async function loadMyRating(courtId) {
  err.value = ''
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    const snap = await getDoc(doc(db, 'courts', courtId, 'ratings', uid))
    if (snap.exists()) {
      myRating.value = Number(snap.data()?.value || 0)
    }
  } catch (e) {
    console.error(e)
    err.value = 'Failed to load your rating.'
  }
}

/* Write/update rating */
async function rate(value) {
  err.value = ''
  const uid = auth.currentUser?.uid
  if (!uid) {
    err.value = 'Please sign in to rate.'
    return
  }
  if (!court.value?.id) return

  try {
    await setDoc(
      doc(db, 'courts', court.value.id, 'ratings', uid),
      { value: Number(value), updatedAt: serverTimestamp() },
      { merge: true }
    )
    myRating.value = Number(value)
  } catch (e) {
    console.error(e)
    err.value = e?.message || 'Failed to submit rating.'
  }
}
</script>

<style scoped>
h2 { font-size: 1.8rem; }
.card-body p { font-size: 0.95rem; line-height: 1.4; }

.star-btn { text-decoration: none; font-size: 1.5rem; line-height: 1; }
.star-btn:hover span { filter: brightness(0.9); }
</style>