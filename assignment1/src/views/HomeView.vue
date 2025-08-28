<template>
  <section>
    <h2 class="mb-3">Upcoming Programs</h2>

    <div class="row g-3">
      <div v-for="p in programs" :key="p.id" class="col-12 col-md-6 col-xl-4">
        <ProgramCard :program="p" @apply="openApply(p)" />
      </div>
    </div>

    <div v-if="selected" class="mt-5">
      <h4 class="mb-3">Apply: {{ selected.title }}</h4>
      <form class="row g-3" @submit.prevent="submitForm">
        <div class="col-md-6">
          <label class="form-label">Full Name (required)</label>
          <input class="form-control" v-model.trim="form.name"
                 required minlength="2" @blur="validateName"/>
          <div v-if="errors.name" class="text-danger small">{{ errors.name }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label">Email (required)</label>
          <input class="form-control" type="email" v-model.trim="form.email"
                 required @blur="validateEmail"/>
          <div v-if="errors.email" class="text-danger small">{{ errors.email }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label">Player Age (required)</label>
          <input class="form-control" type="number" min="6" max="25" v-model.number="form.age" required />
        </div>

        <div class="col-md-6">
          <label class="form-label">Preferred Session Date (required)</label>
          <input class="form-control" type="date" v-model="form.prefDate" required />
          <div class="form-text" v-if="form.prefDate">
            Selected: {{ formatDateISOToDMY(form.prefDate) }}
          </div>
        </div>

        <div class="col-12">
          <label class="form-label">Notes (optional)</label>
          <textarea class="form-control" rows="2" v-model.trim="form.notes" maxlength="200"></textarea>
        </div>

        <div class="col-12 form-check">
          <input id="notify" class="form-check-input" type="checkbox" v-model="form.notifyParent">
          <label for="notify" class="form-check-label">Also notify parent/guardian</label>
        </div>

        <div class="col-md-6">
          <label class="form-label">Emergency Contact Phone</label>
          <input class="form-control" :required="form.notifyParent"
                 placeholder="e.g. 04xx xxx xxx"
                 v-model.trim="form.emergencyPhone"
                 pattern="^0[2-9]\d{8}$"
                 @blur="validateEmergency"/>
          <div v-if="errors.emergencyPhone" class="text-danger small">{{ errors.emergencyPhone }}</div>
          <div class="form-text">Required only if notifying parent/guardian.</div>
        </div>

        <div class="col-12 d-flex gap-2">
          <button class="btn btn-primary" type="submit">Submit Application</button>
          <button class="btn btn-outline-secondary" type="button" @click="cancelApply">Cancel</button>
        </div>
      </form>
    </div>

    <div class="mt-5">
      <h4 class="mb-3">Recent Applications</h4>
      <div v-if="registrations.length===0" class="text-muted">No submissions yet.</div>
      <div v-else class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Program</th><th>Name</th><th>Email</th><th>Phone</th><th>Age</th><th>Date</th><th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in registrations" :key="r.ts">
              <td>{{ r.program.title }}</td>
              <td>{{ r.form.name }}</td>
              <td>{{ maskEmail(r.form.email) }}</td>
              <td>{{ maskPhone(r.form.emergencyPhone) }}</td>
              <td>{{ r.form.age }}</td>
              <td>{{ formatDateISOToDMY(r.form.prefDate) }}</td>
              <td>{{ formatDateTimeDMY(r.ts) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { fetchPrograms } from '../services/data.js'
import ProgramCard from '../components/ProgramCard.vue'
import { formatDateISOToDMY, formatDateTimeDMY, maskEmail, maskPhone } from '../utils/format.js'

const programs = ref([])
const selected = ref(null)
const registrations = ref([])

onMounted(async () => {
  programs.value = await fetchPrograms()
  registrations.value = JSON.parse(localStorage.getItem('registrations') || '[]')
})

function openApply(p){ selected.value = p }
function cancelApply(){ selected.value = null; resetForm() }

const form = reactive({
  name:'', email:'', age: null, prefDate:'', notes:'',
  notifyParent:false, emergencyPhone:''
})
const errors = reactive({ name:'', email:'', emergencyPhone:'' })

function validateName(){
  errors.name = form.name.length>=2 ? '' : 'Name must be at least 2 characters.'
}
function validateEmail(){
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  errors.email = ok ? '' : 'Please enter a valid email.'
}
function validateEmergency(){
  if(form.notifyParent){
    const ok = /^0[2-9]\d{8}$/.test(form.emergencyPhone)
    errors.emergencyPhone = ok ? '' : 'Phone must be AU format like 04xxxxxxxx.'
  } else {
    errors.emergencyPhone = ''
  }
}
function allValid(){
  validateName(); validateEmail(); validateEmergency()
  return !errors.name && !errors.email && !errors.emergencyPhone
}
function resetForm(){
  form.name=''; form.email=''; form.age=null; form.prefDate=''; form.notes=''
  form.notifyParent=false; form.emergencyPhone=''
  errors.name=errors.email=errors.emergencyPhone=''
}

function submitForm(){
  if(!allValid()) return
  const reg = { program: selected.value, form: { ...form }, ts: Date.now() }
  const list = JSON.parse(localStorage.getItem('registrations') || '[]')
  list.unshift(reg)
  localStorage.setItem('registrations', JSON.stringify(list))
  registrations.value = list
  cancelApply()
  alert('Application submitted!')
}
</script>