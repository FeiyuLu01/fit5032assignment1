<template>
    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="mb-3">Create New Court</h5>
  
        <div v-if="err" class="alert alert-danger py-2">{{ err }}</div>
  
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Name</label>
            <input v-model="form.name" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Address</label>
            <input v-model="form.address" class="form-control" required />
          </div>
  
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Hoops</label>
              <input v-model.number="form.hoops" type="number" min="0" class="form-control" />
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <div class="form-check">
                <input v-model="form.lighting" class="form-check-input" type="checkbox" id="lighting">
                <label class="form-check-label" for="lighting">Lighting</label>
              </div>
            </div>
          </div>
  
          <div class="mt-3">
            <button class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { createCourt } from '@/services/admin'
  
  const emit = defineEmits(['submitted'])
  
  const form = ref({ name:'', address:'', hoops:0, lighting:false, tags:[] })
  const loading = ref(false)
  const err = ref('')
  
  async function submit() {
    err.value = ''
    loading.value = true
    try {
      if (!form.value.name?.trim() || !form.value.address?.trim()) {
        err.value = 'Name 和 Address 为必填'
        return
      }
      await createCourt(form.value)
      form.value = { name:'', address:'', hoops:0, lighting:false, tags:[] }
      emit('submitted')
    } catch (e) {
      console.error('[CreateCourt] failed:', e)
      err.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }
  </script>