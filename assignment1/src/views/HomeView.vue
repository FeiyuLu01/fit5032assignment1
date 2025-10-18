<!-- src/views/HomeView.vue -->
<template>
  <section class="home container py-4">
    <!-- Announcements -->
    <div class="mb-4">
      <div class="section-head mb-3">
        <h2 class="h4 fw-bold text-primary">Announcements</h2>
        <p class="text-muted">Stay up to date with club news</p>
      </div>

      <div v-if="announcements.length">
        <div
          class="card card-soft mb-3"
          v-for="(a, idx) in announcements"
          :key="a.id"
        >
          <div class="card-body">
            <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap">
              <div class="flex-fill">
                <h6 class="mb-1 fw-semibold">{{ a.title }}</h6>
                <small class="text-muted">
                  {{ formatTime(a.createdAt) }}
                  <!-- show NEW only on the very latest item -->
                  <span
                    v-if="idx === 0 && isRecent(a.createdAt)"
                    class="badge ms-2 bg-primary-subtle text-primary fw-semibold"
                  >NEW</span>
                </small>

                <div class="mt-2">
                  <SafeHtmlBlock v-if="a.bodyHtml" :html="a.bodyHtml" />
                  <p v-else class="mb-0">{{ a.body }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="card card-soft">
        <div class="card-body text-muted">No announcements yet.</div>
      </div>
    </div>

    <!-- Upcoming Programs -->
    <div class="section-head mb-3">
      <h2 class="h4 fw-bold text-primary">Upcoming Programs</h2>
      <p class="text-muted">Join our latest training sessions and activities</p>
    </div>

    <div class="row g-3">
      <div v-for="p in programs" :key="p.id" class="col-12 col-md-6 col-xl-4">
        <ProgramCard :program="p" @apply="openApply(p)" />
      </div>
    </div>

    <!-- Application form -->
    <div v-if="selected" class="mt-5">
      <div class="card shadow-sm border-0 rounded-3">
        <div class="card-body">
          <h4 class="mb-3 text-primary">Apply: {{ selected.title }}</h4>

          <form class="row g-3" @submit.prevent="submitForm">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Full Name (required)</label>
              <input class="form-control" v-model.trim="form.name" required minlength="2" @blur="validateName" />
              <div v-if="errors.name" class="text-danger small">{{ errors.name }}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Email (required)</label>
              <input class="form-control" type="email" v-model.trim="form.email" required @blur="validateEmail" />
              <div v-if="errors.email" class="text-danger small">{{ errors.email }}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Player Age (required)</label>
              <input class="form-control" type="number" min="6" max="25" v-model.number="form.age" required />
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Preferred Session Date (required)</label>
              <input class="form-control" type="date" v-model="form.prefDate" required />
              <div class="form-text" v-if="form.prefDate">Selected: {{ formatDateISOToDMY(form.prefDate) }}</div>
            </div>

            <div class="col-12">
              <label class="form-label fw-semibold">Notes (optional)</label>
              <textarea class="form-control" rows="2" v-model.trim="form.notes" maxlength="200"></textarea>
            </div>

            <div class="col-12 form-check">
              <input id="notify" class="form-check-input" type="checkbox" v-model="form.notifyParent" />
              <label for="notify" class="form-check-label">Also notify parent/guardian</label>
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Emergency Contact Phone</label>
              <input
                class="form-control"
                :required="form.notifyParent"
                placeholder="e.g. 04xx xxx xxx"
                v-model.trim="form.emergencyPhone"
                pattern="^0[2-9]\\d{8}$"
                @blur="validateEmergency"
              />
              <div v-if="errors.emergencyPhone" class="text-danger small">{{ errors.emergencyPhone }}</div>
              <div class="form-text">Required only if notifying parent/guardian.</div>
            </div>

            <div class="col-12 d-flex gap-2">
              <button class="btn btn-primary" type="submit" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submit Application
              </button>
              <button class="btn btn-outline-secondary" type="button" @click="cancelApply" :disabled="submitting">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Recent applications -->
    <div class="mt-5">
      <div class="section-head mb-3 d-flex justify-content-between align-items-center">
        <h4 class="fw-bold text-primary mb-0">Recent Applications</h4>
        <span v-if="loadingApplications" class="text-muted small">Loading…</span>
      </div>

      <div v-if="!loadingApplications && registrations.length === 0" class="text-muted">No submissions yet.</div>
      <div v-else class="card shadow-sm border-0 rounded-3">
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col">Program</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Age</th>
                <th scope="col">Date</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
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
                <td>
                  <span :class="statusClass(r.status)">
                    {{ statusLabel(r.status) }}
                  </span>
                  <div v-if="r.decisionNote" class="small text-muted">{{ r.decisionNote }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/* Data & components */
import { onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import ProgramCard from '@/components/ProgramCard.vue'
import SafeHtmlBlock from '@/components/SafeHtmlBlock.vue'
import { fetchPrograms } from '@/services/data.js'
import { listenAnnouncements, fetchAnnouncementsOnce } from '@/services/announcements.js'
import { formatDateISOToDMY, formatDateTimeDMY, maskEmail, maskPhone } from '@/utils/format.js'
import { applyForProgram, fetchMyApplications } from '@/services/applications.js'
import { useAuthState } from '@/state/authState'

/* Announcements state */
const announcements = ref([])
let unlisten = null

/* Programs / applications state */
const programs = ref([])
const selected = ref(null)
const registrations = ref([])
const { state: authState } = useAuthState()

/* Mount: load programs & announcements */
onMounted(async () => {
  const fetchedPrograms = await fetchPrograms()
  programs.value = Array.isArray(fetchedPrograms) ? fetchedPrograms.slice(0, 6) : []
  await loadApplications()

  try {
    unlisten = listenAnnouncements(list => {
      announcements.value = list || []
    })
  } catch (e) {
    // fallback once
    try {
      announcements.value = await fetchAnnouncementsOnce()
    } catch {
      announcements.value = []
    }
  }
})

onBeforeUnmount(() => { if (typeof unlisten === 'function') unlisten() })

watch(
  () => authState.user?.uid,
  async () => {
    await loadApplications()
  }
)

/* Application logic (kept as original) */
function openApply(p) { selected.value = p }
function cancelApply() { selected.value = null; resetForm() }

const form = reactive({
  name: '', email: '', age: null, prefDate: '', notes: '',
  notifyParent: false, emergencyPhone: ''
})
const errors = reactive({ name: '', email: '', emergencyPhone: '' })
const loadingApplications = ref(false)
const submitting = ref(false)

async function loadApplications() {
  const uid = authState.user?.uid
  if (!uid) {
    registrations.value = []
    return
  }
  loadingApplications.value = true
  try {
    const list = await fetchMyApplications(uid)
    registrations.value = list.map((item) => ({
      id: item.id,
      program: { id: item.programId, title: item.programTitle },
      form: {
        name: item.applicantName,
        email: item.applicantEmail,
        emergencyPhone: item.emergencyPhone,
        age: item.age,
        prefDate: item.prefDate
      },
      status: item.status,
      decisionNote: item.decisionNote,
      ts: item.submittedAt ? item.submittedAt.getTime() : Date.now()
    }))
  } catch (err) {
    console.error('Failed to load applications', err)
  } finally {
    loadingApplications.value = false
  }
}

function validateName () {
  errors.name = form.name.length >= 2 ? '' : 'Name must be at least 2 characters.'
}
function validateEmail () {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  errors.email = ok ? '' : 'Please enter a valid email.'
}
function validateEmergency () {
  if (form.notifyParent) {
    const ok = /^0[2-9]\d{8}$/.test(form.emergencyPhone)
    errors.emergencyPhone = ok ? '' : 'Phone must be AU format like 04xxxxxxxx.'
  } else {
    errors.emergencyPhone = ''
  }
}
function allValid () {
  validateName(); validateEmail(); validateEmergency()
  return !errors.name && !errors.email && !errors.emergencyPhone
}
function resetForm () {
  form.name=''; form.email=''; form.age=null; form.prefDate=''; form.notes=''
  form.notifyParent=false; form.emergencyPhone=''
  errors.name=errors.email=errors.emergencyPhone=''
}
async function submitForm () {
  if (!allValid()) return
  if (!authState.user) {
    alert('Please sign in before submitting an application.')
    return
  }

  submitting.value = true
  try {
    await applyForProgram(selected.value.id, {
      ...form
    })
    alert('Application submitted successfully!')
    await loadApplications()
    cancelApply()
  } catch (err) {
    console.error('submitForm failed', err)
    alert(err?.message || 'Failed to submit application. Please try again.')
  } finally {
    submitting.value = false
  }
}

/* Helpers */
function formatTime (ts) {
  try {
    if (!ts) return ''
    const dt = ts?.toDate ? ts.toDate() : new Date(ts)
    return dt.toLocaleString()
  } catch { return '' }
}

/* Only the latest one should get NEW; also require it to be recent (48h) */
function isRecent (ts) {
  try {
    const dt = ts?.toDate ? ts.toDate() : new Date(ts)
    return Date.now() - dt.getTime() < 1000 * 60 * 60 * 48
  } catch { return false }
}

function statusClass(value) {
  const status = (value || '').toLowerCase()
  if (status === 'approved') return 'badge text-bg-success text-uppercase'
  if (status === 'rejected') return 'badge text-bg-danger text-uppercase'
  return 'badge text-bg-warning text-uppercase'
}

function statusLabel(value) {
  const status = (value || '').toLowerCase()
  if (!status) return 'Pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<style scoped>
.card-soft{ border:1px solid rgba(0,0,0,.06); border-radius:12px }
.section-head p{ margin: .25rem 0 0 }
</style>
