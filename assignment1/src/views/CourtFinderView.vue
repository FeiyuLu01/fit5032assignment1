<template>
    <section>
      <h2 class="mb-3">Court Finder</h2>
      <form class="row g-3 mb-3" @submit.prevent="applyFilters">
        <div class="col-12 col-md-4">
          <label class="form-label">Suburb</label>
          <input class="form-control" v-model.trim="q.suburb" minlength="2" placeholder="e.g. Brunswick" />
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label">Max Radius (km)</label>
          <input class="form-control" type="number" min="1" max="50" v-model.number="q.radius" @blur="validateFilter"/>
          <div v-if="err" class="text-danger small">{{ err }}</div>
        </div>
        <div class="col-6 col-md-3 d-flex align-items-end">
          <div class="form-check">
            <input id="indoor" class="form-check-input" type="checkbox" v-model="q.indoor">
            <label class="form-check-label" for="indoor">Indoor only</label>
          </div>
        </div>
        <div class="col-12 col-md-3 d-flex align-items-end gap-2">
          <button class="btn btn-primary" type="submit">Search</button>
          <button class="btn btn-outline-secondary" type="button" @click="reset">Reset</button>
        </div>
      </form>
  
      <div class="row g-3">
        <div v-for="c in filtered" :key="c.id" class="col-12 col-md-6 col-xl-4">
          <div class="card h-100 card-hover">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h5 class="card-title mb-1">{{ c.name }}</h5>
                <button class="btn btn-sm" :class="app.isFaved(c.id)?'btn-warning':'btn-outline-secondary'"
                        @click="app.toggleFave(c.id)">
                  {{ app.isFaved(c.id) ? '★' : '☆' }}
                </button>
              </div>
              <p class="mb-1 text-muted">{{ c.suburb }} · {{ c.indoor ? 'Indoor' : 'Outdoor' }} · {{ c.cost }}</p>
              <p class="small mb-2">Hours: {{ c.hours }} · Surface: {{ c.surfaces.join(', ') }}</p>
              <router-link :to="`/courts/${c.id}`" class="btn btn-outline-primary btn-sm">Details</router-link>
            </div>
          </div>
        </div>
        <div v-if="filtered.length===0" class="text-muted">No courts match your filter.</div>
      </div>
    </section>
  </template>
  
  <script setup>
  import { onMounted, reactive, ref, computed } from 'vue'
  import { fetchCourts } from '../services/data'
  import { useAppState } from '../state/appState'
  
  const app = useAppState()
  const courts = ref([])
  onMounted(async ()=>{ app.init(); courts.value = await fetchCourts() })
  
  const q = reactive({ suburb:'', radius:null, indoor:false })
  const err = ref('')
  
  function validateFilter(){
    if(q.radius && (!q.suburb || q.suburb.length<2)) {
      err.value = 'Please enter a suburb when using radius filter.'
    } else {
      err.value = ''
    }
  }
  function applyFilters(){ validateFilter() }
  function reset(){ q.suburb=''; q.radius=null; q.indoor=false; err.value='' }
  
  const filtered = computed(()=>{
    return courts.value.filter(c=>{
      if(q.indoor && !c.indoor) return false
      if(q.suburb && !c.suburb.toLowerCase().includes(q.suburb.toLowerCase())) return false
      return true
    })
  })
  </script>