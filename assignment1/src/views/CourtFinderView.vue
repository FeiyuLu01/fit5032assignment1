<template>
  <section class="container py-4 court-finder">
    <!-- Section header -->
    <div class="section-head mb-4">
      <h2 class="h4 fw-bold text-primary">Court Finder</h2>
      <p class="text-muted">Search for courts by suburb, distance and type</p>
    </div>

    <!-- Search form (pure UI; click handlers run real search/reset) -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label fw-semibold">Suburb</label>
            <input v-model.trim="suburb" type="text" class="form-control" placeholder="e.g. Brunswick" />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-semibold">Max Radius (km)</label>
            <input v-model.number="radius" type="number" min="0" class="form-control" />
          </div>
          <div class="col-md-2 d-flex align-items-center">
            <div class="form-check mt-3">
              <input v-model="indoorOnly" class="form-check-input" type="checkbox" id="indoorOnly" />
              <label for="indoorOnly" class="form-check-label">Indoor only</label>
            </div>
          </div>
          <div class="col-md-2 d-flex gap-2">
            <!-- NOTE: use click handlers (no form submit) to avoid interfering with your logic -->
            <button type="button" class="btn btn-primary flex-fill" @click="search">Search</button>
            <button type="button" class="btn btn-outline-secondary flex-fill" @click="reset">Reset</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results grid -->
    <div class="row g-3">
      <div v-for="c in courts" :key="c.id" class="col-12 col-md-6 col-xl-4">
        <div class="card h-100 shadow-sm border-0 court-card">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title fw-bold mb-0">{{ c.name }}</h5>
              <!-- Favourite (logic unchanged) -->
              <button class="btn btn-sm fav-btn"
                      :class="isFaved(c.id) ? 'btn-warning' : 'btn-outline-secondary'"
                      @click="toggleFav(c.id)"
                      :aria-label="isFaved(c.id) ? 'Remove favourite' : 'Add favourite'">
                {{ isFaved(c.id) ? '★' : '☆' }}
              </button>
            </div>

            <p class="text-muted mb-1">
              {{ c.suburb }} · {{ c.indoor ? 'Indoor' : 'Outdoor' }} · {{ c.cost }}
            </p>
            <p class="small text-muted mb-1">Hours: {{ c.hours }}</p>
            <p class="small text-muted mb-3">Surface: {{ c.surfaces.join(', ') }}</p>

            <div class="mt-auto">
              <router-link :to="{ name: 'courtDetails', params: { id: c.id } }"
                           class="btn btn-outline-primary btn-sm">Details</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="courts.length === 0" class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-muted">No courts matched your criteria.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// UI-only polish; search/reset logic is restored to actually filter results.
import { ref, onMounted } from 'vue'
import { fetchCourts } from '../services/data.js'
import { useAppState } from '../state/appState.js'

const app = useAppState()

// Full dataset and filtered dataset
const allCourts = ref([])   // keep original results here
const courts = ref([])      // render from this list

// Controls
const suburb = ref('')
const radius = ref(null)    // in km
const indoorOnly = ref(false)

// Load initial data once
onMounted(async () => {
  const list = await fetchCourts()
  allCourts.value = Array.isArray(list) ? list : []
  courts.value = allCourts.value
})

/**
 * Calculate distance (km) between two points using Haversine.
 * If any coordinate is missing, returns Infinity so it will be filtered out when radius is set.
 */
function distanceKm(a, b) {
  if (!a || !b || typeof a.lat !== 'number' || typeof a.lng !== 'number' ||
      typeof b.lat !== 'number' || typeof b.lng !== 'number') return Infinity
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const la1 = a.lat * Math.PI / 180
  const la2 = b.lat * Math.PI / 180

  const h = Math.sin(dLat/2) ** 2 +
            Math.cos(la1) * Math.cos(la2) * Math.sin(dLng/2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Run search based on current controls.
 * - Suburb: case-insensitive substring
 * - Indoor only: strict true filter
 * - Radius: if we have both user and court coordinates, apply haversine; otherwise skip radius filter
 */
function search() {
  const base = allCourts.value.slice()

  const hasSuburb = suburb.value && suburb.value.trim().length > 0
  const q = hasSuburb ? suburb.value.trim().toLowerCase() : ''

  // Try to locate a user/base point; if not present, radius will be ignored gracefully
  // You can set app.userLocation = { lat, lng } elsewhere in your app if available
  const userPt = app?.userLocation || null

  const filtered = base.filter((c) => {
    // suburb filter
    if (hasSuburb) {
      const s = (c.suburb || '').toLowerCase()
      if (!s.includes(q)) return false
    }
    // indoor filter
    if (indoorOnly.value && !c.indoor) return false
    // radius filter (optional)
    if (radius.value && Number(radius.value) > 0 && userPt) {
      const courtPt = { lat: c.lat, lng: c.lng }
      const d = distanceKm(userPt, courtPt)
      if (d === Infinity || d > Number(radius.value)) return false
    }
    return true
  })

  courts.value = filtered
}

/** Reset controls and restore original list */
function reset() {
  suburb.value = ''
  radius.value = null
  indoorOnly.value = false
  courts.value = allCourts.value
}

/** Favourite helpers (kept from your app state; logic unchanged) */
function isFaved(id) {
  return app.isFaved(id)
}
function toggleFav(id) {
  app.toggleFave(id)
}
</script>

<style scoped>
/* Visual only: does not affect logic */
.section-head h2 { color: #0a58ca; }

.card.court-card {
  border-radius: 12px;
  transition: box-shadow .18s ease-in-out, transform .18s ease-in-out;
}
.card.court-card:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,.08);
  transform: translateY(-2px);
}

.fav-btn {
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
}
</style>