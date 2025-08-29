<template>
    <section v-if="court">
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <h2 class="m-0">{{ court.name }}</h2>
        <button class="btn btn-sm" :class="isFaved ? 'btn-warning':'btn-outline-secondary'" @click="toggleFav">
          {{ isFaved ? '★ Favourited' : '☆ Favourite' }}
        </button>
      </div>
  
      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <p class="mb-1"><b>Suburb:</b> {{ court.suburb }}</p>
              <p class="mb-1"><b>Type:</b> {{ court.indoor ? 'Indoor' : 'Outdoor' }}</p>
              <p class="mb-1"><b>Cost:</b> {{ court.cost }}</p>
              <p class="mb-1"><b>Hours:</b> {{ court.hours }}</p>
              <p class="mb-1"><b>Surface:</b> {{ court.surfaces.join(', ') }}</p>
              <!-- <p class="mb-0"><b>Coordinates:</b> {{ court.lat }}, {{ court.lng }}</p> -->
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="ratio ratio-16x9">
            <iframe
              title="Map preview"
              src="about:blank"
              style="background:#f3f3f3; border:1px solid #ddd; border-radius:.5rem;">
            </iframe>
          </div>
        </div>
      </div>
    </section>
  
    <div v-else class="text-muted">Loading…</div>
  </template>
  
  <script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { fetchCourtById } from '../services/data'
  import { useAppState } from '../state/appState'
  
  const route = useRoute()
  const app = useAppState()
  const court = ref(null)
  
  onMounted(async ()=>{
    app.init()
    court.value = await fetchCourtById(route.params.id)
  })
  
  const isFaved = computed(()=> court.value ? app.isFaved(court.value.id) : false)
  function toggleFav(){ if(court.value) app.toggleFave(court.value.id) }
  </script>