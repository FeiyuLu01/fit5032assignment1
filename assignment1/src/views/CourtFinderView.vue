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

    <!-- Map with advanced features (BR E.2 Geo location: search + routing) -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-start">
          <div class="col-12 col-lg-4">
            <label class="form-label fw-semibold" for="mapSearch">Plan a route</label>
            <input
              id="mapSearch"
              ref="searchInputEl"
              type="text"
              class="form-control"
              placeholder="Search a starting location"
              :disabled="!mapReady"
            />
            <div class="form-text">Type an address or place name and pick from the suggestions.</div>
            <div class="mt-3">
              <div class="fw-semibold">Route controls</div>
              <p class="small text-muted mb-2">
                Select a court from the list or map markers to preview directions. You can clear the current route at any time.
              </p>
              <button class="btn btn-outline-secondary btn-sm" type="button" @click="clearRoute" :disabled="!routeActive">
                Clear Route
              </button>
            </div>
            <div v-if="mapStatus" class="alert alert-warning mt-3" role="status">{{ mapStatus }}</div>
            <div v-if="selectedCourt" class="mt-3">
              <div class="fw-semibold">Selected court</div>
              <p class="small mb-1">{{ selectedCourt.name }}<br><span class="text-muted">{{ selectedCourt.address || selectedCourt.suburb }}</span></p>
              <button class="btn btn-sm btn-primary" type="button" @click="routeToCourt(selectedCourt)" :disabled="!originPoint">
                Show directions
              </button>
            </div>
          </div>
          <div class="col-12 col-lg-8">
            <div ref="mapRef" class="court-map" role="img" aria-label="Map showing basketball courts"></div>
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
              <button
                class="btn btn-link btn-sm"
                type="button"
                @click="focusOnCourt(c)"
                :disabled="!mapReady"
              >
                View on map
              </button>
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
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

// Map state
const mapRef = ref(null)
const searchInputEl = ref(null)
const mapReady = ref(false)
const mapStatus = ref('')
const originPoint = ref(null)
const selectedCourt = ref(null)
const routeActive = ref(false)

let googleModule = null
let mapInstance = null
let directionsService = null
let directionsRenderer = null
let autocomplete = null
let infoWindow = null
let originMarker = null
const markers = []

const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
let googleLoaderPromise = null

// Load initial data once
onMounted(async () => {
  const list = await fetchCourts()
  allCourts.value = Array.isArray(list) ? list : []
  courts.value = allCourts.value
  await initMap()
})

onBeforeUnmount(() => {
  markers.forEach(marker => marker.setMap(null))
  markers.length = 0
  if (originMarker) originMarker.setMap(null)
  if (directionsRenderer) directionsRenderer.setMap(null)
})

watch(courts, () => {
  renderMarkers()
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
async function initMap() {
  if (!googleApiKey) {
    mapStatus.value = 'Google Maps API key is not configured. Map features are unavailable.'
    return
  }
  if (!mapRef.value) return
  try {
    googleModule = await loadGoogleMapsScript()
    if (!googleModule) {
      mapStatus.value = 'Unable to load Google Maps. Check API configuration.'
      return
    }
    const { maps } = googleModule
    mapInstance = new maps.Map(mapRef.value, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    })
    directionsService = new maps.DirectionsService()
    directionsRenderer = new maps.DirectionsRenderer({ map: mapInstance, suppressMarkers: false })
    infoWindow = new maps.InfoWindow()
    mapReady.value = true
    initAutocomplete()
    renderMarkers()
  } catch (err) {
    console.error('initMap failed', err)
    mapStatus.value = 'Unable to load Google Maps. Check API configuration.'
  }
}

function loadGoogleMapsScript() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google)
  }
  if (!googleLoaderPromise) {
    googleLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const params = new URLSearchParams({
        key: googleApiKey,
        libraries: 'places'
      })
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.google)
      script.onerror = (err) => reject(err)
      document.head.appendChild(script)
    })
  }
  return googleLoaderPromise
}

function initAutocomplete() {
  if (!googleModule || !searchInputEl.value) return
  const { maps } = googleModule
  autocomplete = new maps.places.Autocomplete(searchInputEl.value, {
    fields: ['geometry', 'formatted_address', 'name']
  })
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place || !place.geometry || !place.geometry.location) {
      mapStatus.value = 'Could not determine that location. Try another search.'
      return
    }
    const position = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }
    originPoint.value = {
      ...position,
      label: place.formatted_address || place.name || ''
    }
    app.userLocation = position
    if (!originMarker) {
      originMarker = new maps.Marker({
        map: mapInstance,
        title: 'Starting location',
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#0d6efd',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })
    }
    originMarker.setPosition(position)
    mapInstance.panTo(position)
    mapStatus.value = 'Starting point set. Select a court to view directions.'
    routeActive.value = false
    if (directionsRenderer) {
      directionsRenderer.set('directions', null)
    }
  })
}

function renderMarkers() {
  if (!mapReady.value || !googleModule || !mapInstance) return
  markers.forEach(marker => marker.setMap(null))
  markers.length = 0
  const { maps } = googleModule
  courts.value.forEach((court) => {
    if (typeof court.lat !== 'number' || typeof court.lng !== 'number') return
    const marker = new maps.Marker({
      map: mapInstance,
      position: { lat: court.lat, lng: court.lng },
      title: court.name
    })
    marker.addListener('click', () => {
      focusOnCourt(court)
    })
    markers.push(marker)
  })
}

function focusOnCourt(court) {
  if (!mapReady.value || !mapInstance) return
  if (typeof court.lat !== 'number' || typeof court.lng !== 'number') {
    mapStatus.value = 'Location details for this court are not available yet.'
    return
  }
  selectedCourt.value = court
  mapInstance.panTo({ lat: court.lat, lng: court.lng })
  mapInstance.setZoom(14)
  if (infoWindow) {
    infoWindow.setContent(`<div><strong>${court.name}</strong><br/>${court.address || court.suburb || ''}</div>`)
    infoWindow.setPosition({ lat: court.lat, lng: court.lng })
    infoWindow.open({ map: mapInstance })
  }
  if (!originPoint.value) {
    mapStatus.value = 'Select a starting location to plan a route.'
  } else {
    mapStatus.value = 'Click "Show directions" to generate the route.'
  }
}

async function routeToCourt(court) {
  if (!originPoint.value) {
    mapStatus.value = 'Please search for a starting location before generating a route.'
    return
  }
  if (!mapReady.value || !directionsService || !directionsRenderer) return
  if (typeof court.lat !== 'number' || typeof court.lng !== 'number') {
    mapStatus.value = 'Selected court does not have map coordinates.'
    return
  }
  try {
    const origin = { lat: originPoint.value.lat, lng: originPoint.value.lng }
    const destination = { lat: court.lat, lng: court.lng }
    const result = await directionsService.route({
      origin,
      destination,
      travelMode: googleModule.maps.TravelMode.DRIVING
    })
    directionsRenderer.setDirections(result)
    routeActive.value = true
    const leg = result.routes?.[0]?.legs?.[0]
    if (leg?.distance && leg?.duration) {
      mapStatus.value = `Route ready: ${leg.distance.text}, approx. ${leg.duration.text}.`
    } else {
      mapStatus.value = 'Route ready.'
    }
  } catch (err) {
    console.error('routeToCourt failed', err)
    mapStatus.value = 'Unable to calculate route for this court.'
  }
}

function clearRoute() {
  if (directionsRenderer) {
    directionsRenderer.set('directions', null)
  }
  routeActive.value = false
  mapStatus.value = ''
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

.court-map {
  width: 100%;
  min-height: 320px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.1);
}
</style>
