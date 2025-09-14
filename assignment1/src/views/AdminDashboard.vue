<!-- src/views/AdminDashboard.vue -->
<template>
  <section class="container py-4">
    <!-- Top bar -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="m-0">Dashboard</h2>
      <nav class="nav nav-pills gap-2">
        <button
          class="btn"
          :class="currentTab === 'courts' ? 'btn-primary' : 'btn-outline-primary'"
          @click="goTab('courts')"
        >Courts</button>
        <button
          class="btn"
          :class="currentTab === 'create' ? 'btn-primary' : 'btn-outline-primary'"
          @click="goTab('create')"
        >Create Court</button>
        <button
          class="btn"
          :class="currentTab === 'announcements' ? 'btn-primary' : 'btn-outline-primary'"
          @click="goTab('announcements')"
        >Announcements</button>
      </nav>
    </div>

    <!-- KPIs -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Courts</div>
            <div class="fs-2 fw-bold">{{ kpi.courts }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Users</div>
            <div class="fs-2 fw-bold">{{ kpi.users }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Admins</div>
            <div class="fs-2 fw-bold">{{ kpi.admins }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Announcements</div>
            <div class="fs-2 fw-bold">{{ kpi.announcements }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Courts -->
    <div v-if="currentTab === 'courts'">
      <!-- Sub tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button class="nav-link" :class="{active: subTab==='approved'}" @click="subTab='approved'">
            Approved
          </button>
        </li>
        <!-- <li class="nav-item">
          <button class="nav-link" :class="{active: subTab==='pending'}" @click="subTab='pending'">
            Pending
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" :class="{active: subTab==='rejected'}" @click="subTab='rejected'">
            Rejected
          </button>
        </li> -->
      </ul>

      <!-- Approved table -->
      <div v-show="subTab==='approved'" class="card shadow-sm mb-4">
        <div class="card-header fw-semibold">Approved Courts</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th><th>Address</th><th>Hoops</th><th>Lighting</th><th>Updated</th><th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="approved.items.length===0"><td colspan="6" class="text-muted">No data.</td></tr>
              <tr v-for="c in approved.items" :key="c.id">
                <td>{{ c.name }}</td>
                <td>{{ c.address }}</td>
                <td>{{ c.hoops ?? 0 }}</td>
                <td>{{ c.lighting ? 'Yes' : 'No' }}</td>
                <td>{{ formatTs(c.updatedAt) }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary me-2" disabled>Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="removeCourt(c.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-outline-secondary" @click="loadApproved" :disabled="approved.loading">
            {{ approved.loading ? 'Loading…' : 'Load more' }}
          </button>
        </div>
      </div>

      <!-- Pending table -->
      <div v-show="subTab==='pending'" class="card shadow-sm mb-4">
        <div class="card-header fw-semibold">Pending Courts</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th><th>Address</th><th>Hoops</th><th>Lighting</th><th>Updated</th><th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending.items.length===0"><td colspan="6" class="text-muted">No data.</td></tr>
              <tr v-for="c in pending.items" :key="c.id">
                <td>{{ c.name }}</td>
                <td>{{ c.address }}</td>
                <td>{{ c.hoops ?? 0 }}</td>
                <td>{{ c.lighting ? 'Yes' : 'No' }}</td>
                <td>{{ formatTs(c.updatedAt) }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary me-2" disabled>Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="removeCourt(c.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-outline-secondary" @click="loadPending" :disabled="pending.loading">
            {{ pending.loading ? 'Loading…' : 'Load more' }}
          </button>
        </div>
      </div>

      <!-- Rejected table -->
      <div v-show="subTab==='rejected'" class="card shadow-sm mb-4">
        <div class="card-header fw-semibold">Rejected Courts</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th><th>Address</th><th>Hoops</th><th>Lighting</th><th>Updated</th><th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rejected.items.length===0"><td colspan="6" class="text-muted">No data.</td></tr>
              <tr v-for="c in rejected.items" :key="c.id">
                <td>{{ c.name }}</td>
                <td>{{ c.address }}</td>
                <td>{{ c.hoops ?? 0 }}</td>
                <td>{{ c.lighting ? 'Yes' : 'No' }}</td>
                <td>{{ formatTs(c.updatedAt) }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-secondary me-2" disabled>Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="removeCourt(c.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-outline-secondary" @click="loadRejected" :disabled="rejected.loading">
            {{ rejected.loading ? 'Loading…' : 'Load more' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tab: Create -->
    <div v-else-if="currentTab === 'create'">
      <div class="card shadow-sm">
        <div class="card-header fw-semibold">Create Court</div>
        <form class="card-body row g-3" @submit.prevent="submitCreate">
          <div class="col-md-6">
            <label class="form-label">Name</label>
            <input v-model.trim="form.name" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Address</label>
            <input v-model.trim="form.address" class="form-control" required />
          </div>
          <div class="col-md-4">
            <label class="form-label">Hoops</label>
            <input v-model.number="form.hoops" type="number" min="0" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Lighting</label>
            <select v-model="form.lighting" class="form-select">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Tags (comma separated)</label>
            <input v-model.trim="tagsInput" class="form-control" placeholder="indoor, timber" />
          </div>
          <div class="col-12 d-flex gap-2">
            <button class="btn btn-primary" :disabled="createLoading">
              <span v-if="createLoading" class="spinner-border spinner-border-sm me-2"></span>
              Create
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="resetForm">Reset</button>
          </div>
          <div v-if="createErr" class="alert alert-danger mb-0">{{ createErr }}</div>
        </form>
      </div>
    </div>

    <!-- Tab: Announcements -->
    <div v-else>
      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header fw-semibold">Publish</div>
            <form class="card-body d-grid gap-3" @submit.prevent="submitAnnouncement">
              <div>
                <label class="form-label">Title</label>
                <input v-model.trim="annForm.title" class="form-control" maxlength="120" required />
              </div>
              <div>
                <label class="form-label">Content</label>
                <textarea v-model.trim="annForm.content" class="form-control" rows="6" required></textarea>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" :disabled="annLoading">
                  <span v-if="annLoading" class="spinner-border spinner-border-sm me-2"></span>
                  Publish
                </button>
                <button type="button" class="btn btn-outline-secondary" @click="resetAnnouncement">Clear</button>
              </div>
              <div v-if="annErr" class="alert alert-danger mb-0">{{ annErr }}</div>
            </form>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header fw-semibold">Recent</div>
            <ul class="list-group list-group-flush">
              <li v-if="annList.length===0" class="list-group-item text-muted">
                No data.
              </li>
              <li v-for="a in annList" :key="a.id" class="list-group-item">
                <div class="fw-semibold">{{ a.title }}</div>
                <div class="small text-muted">{{ formatTs(a.createdAt) }}</div>
                <div class="mt-2">{{ a.content }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { sanitizeHTML } from '@/utils/sanitize'
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Admin service functions
import {
  // KPIs
  countCourtsAll, countUsersByRole, countAnnouncementsAll,
  // Courts
  listApprovedCourts, createCourt, deleteCourtById,
  // Announcements
  listAnnouncements, createAnnouncement
} from '@/services/admin'

// Router helpers
const route = useRoute()
const router = useRouter()

// Current main tab
const currentTab = computed(() => route.meta?.tab || 'courts')

// Courts sub-tab
const subTab = ref('approved')

// KPI data
const kpi = reactive({ courts: 0, users: 0, admins: 0, announcements: 0 })

// Approved/Pending/Rejected tables and cursors
const approved = reactive({ items: [], cursor: null, loading: false })
const pending  = reactive({ items: [], cursor: null, loading: false })
const rejected = reactive({ items: [], cursor: null, loading: false })

// Create form
const form = reactive({ name: '', address: '', hoops: 0, lighting: true, tags: [] })
const tagsInput = ref('')
const createLoading = ref(false)
const createErr = ref('')

// Announcements
const annForm = reactive({ title: '', content: '' })
const annList = ref([])
const annLoading = ref(false)
const annErr = ref('')

// Navigation
function goTab(tab) {
  if (tab === 'courts')         router.push({ name: 'admin' })
  else if (tab === 'create')    router.push({ name: 'adminCreateCourt' })
  else                          router.push({ name: 'adminAnnouncements' })
}

// Format Firestore timestamp or date
function formatTs(ts) {
  try {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleString()
  } catch { return '' }
}

// Load KPI from Firestore
async function loadKpi() {
  kpi.courts = await countCourtsAll().catch(() => 0)
  kpi.users  = await countUsersByRole('user').catch(() => 0)
  kpi.admins = await countUsersByRole('admin').catch(() => 0)
  kpi.announcements = await countAnnouncementsAll().catch(() => 0)
}

// Load approved/pending/rejected lists
async function loadApproved() {
  if (approved.loading) return
  approved.loading = true
  try {
    const { items, cursor } = await listApprovedCourts({ pageSize: 10, last: approved.cursor })
    approved.items.push(...items)
    approved.cursor = cursor
  } finally { approved.loading = false }
}


// Delete court
async function removeCourt(id) {
  await deleteCourtById(id).catch(() => {})
  // Optimistic refresh: just clear three lists; you can refine if needed
  approved.items = []
  approved.cursor = null
  pending.items = []
  pending.cursor = null
  rejected.items = []
  rejected.cursor = null
  await Promise.all([loadApproved(), loadPending(), loadRejected(), loadKpi()])
}

// Reset create form
function resetForm() {
  form.name = ''; form.address = ''; form.hoops = 0; form.lighting = true
  tagsInput.value = ''; form.tags = []
  createErr.value = ''
}

// Create new court
async function submitCreate() {
  createErr.value = ''
  createLoading.value = true
  try {
    form.tags = (tagsInput.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    await createCourt({ ...form })
    approved.items = []
    approved.cursor = null
    resetForm()
    await Promise.all([loadApproved(), loadKpi()])
    goTab('courts')
  } catch (e) {
    createErr.value = e?.message || 'Create failed.'
  } finally {
    createLoading.value = false
  }
}

// Load announcements
async function loadAnnouncements() {
  annList.value = await listAnnouncements().catch(() => [])
}
function resetAnnouncement() {
  annForm.title = ''; annForm.content = ''; annErr.value = ''
}
async function submitAnnouncement() {
  annErr.value = ''
  annLoading.value = true
  try {
    const cleanTitle = sanitizeHTML(annForm.title || '', {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).trim().slice(0, 120)

    const cleanContent = sanitizeHTML(annForm.content || '', {
      ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'u', 'a'],
      ALLOWED_ATTR: {
        'a': ['href', 'title', 'target']
      },
    }).trim()

    if (!cleanTitle) {
      annErr.value = 'Title is required.'
      annLoading.value = false
      return
    }
    if (!cleanContent) {
      annErr.value = 'Content is required.'
      annLoading.value = false
      return
    }

    await createAnnouncement({
      title: cleanTitle,
      content: cleanContent,      
      bodyHtml: cleanContent   
    })

    resetAnnouncement()
    await loadAnnouncements()
    await loadKpi()
  } catch (e) {
    annErr.value = e?.message || 'Publish failed.'
  } finally {
    annLoading.value = false
  }
}

// Initial load
onMounted(async () => {
  await loadKpi()
  await Promise.all([loadApproved(), loadAnnouncements()])
})
</script>

<style scoped>
.nav-pills .btn { min-width: 9rem; }
.table td, .table th { vertical-align: middle; }
</style>