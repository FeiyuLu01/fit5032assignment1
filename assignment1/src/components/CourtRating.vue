<!-- src/components/CourtRating.vue -->
<template>
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between">
          <h5 class="card-title mb-0">Ratings</h5>
          <small class="text-muted">Average from all users</small>
        </div>
  
        <div class="mt-3 d-flex align-items-center gap-3">
          <div class="display-6 mb-0">{{ avgDisplay }}</div>
          <div>
            <div class="stars fs-4" aria-label="average stars">
              <span v-for="i in 5" :key="i" :class="i <= roundedAvg ? 'text-warning' : 'text-secondary'">★</span>
            </div>
            <div class="text-muted small">{{ rating.count }} rating<span v-if="rating.count !== 1">s</span></div>
          </div>
        </div>
  
        <hr class="my-3"/>
  
        <div v-if="signedIn">
          <div class="mb-2 fw-semibold">Your rating</div>
          <div class="stars fs-3">
            <button
              v-for="i in 5"
              :key="'my-' + i"
              type="button"
              class="btn btn-link p-0 me-1"
              :aria-label="`rate ${i}`"
              @click="rate(i)"
            >
              <span :class="i <= myValue ? 'text-warning' : 'text-secondary'">★</span>
            </button>
          </div>
          <div class="small text-muted" v-if="myValue">You rated: {{ myValue }}/5</div>
          <div class="text-danger mt-2" v-if="err">{{ err }}</div>
        </div>
  
        <div v-else class="alert alert-info mb-0">
          Please sign in to rate this court.
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
  import { auth } from '@/services/firebase'
  import { getMyRatingOnce, listenCourtRatings, setMyRating } from '@/services/ratings'
  
  const props = defineProps({
    courtId: {
      type: [String, Number],
      required: true
    }
  })
  
  const rating = ref({ count: 0, avg: 0, byUser: new Map() })
  const myValue = ref(0)
  const err = ref('')
  
  const signedIn = computed(() => !!auth.currentUser)
  const avgDisplay = computed(() => rating.value.avg.toFixed(1))
  const roundedAvg = computed(() => Math.round(rating.value.avg))
  
  let unlisten
  
  onMounted(async () => {
    unlisten = listenCourtRatings(props.courtId, (r) => {
      rating.value = r
      const uid = auth.currentUser?.uid
      if (uid && r.byUser.has(uid)) {
        myValue.value = Number(r.byUser.get(uid))
      }
    })
    const me = await getMyRatingOnce(props.courtId)
    if (me) myValue.value = me
  })
  
  onBeforeUnmount(() => {
    if (typeof unlisten === 'function') unlisten()
  })
  
  async function rate(v) {
    err.value = ''
    try {
      await setMyRating(props.courtId, v)
      myValue.value = v
    } catch (e) {
      err.value = e?.message || 'Failed to rate'
    }
  }
  </script>
  
  <style scoped>
  .stars button {
    text-decoration: none;
  }
  </style>