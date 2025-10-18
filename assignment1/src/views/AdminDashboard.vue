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
          :class="currentTab === 'applications' ? 'btn-primary' : 'btn-outline-primary'"
          @click="goTab('applications')"
        >Applications</button>
        <button
          class="btn"
          :class="currentTab === 'email' ? 'btn-primary' : 'btn-outline-primary'"
          @click="goTab('email')"
        >Emails</button>
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

    <div class="row g-3 mb-4" v-if="currentTab === 'applications'">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm h-100">
          <div class="card-header fw-semibold">Applications Overview</div>
          <div class="card-body">
            <AdminAnalyticsChart :datasets="applicationDatasets" />
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm h-100">
          <div class="card-header fw-semibold">Recent Applications</div>
          <ul class="list-group list-group-flush" v-if="recentApplications.length">
            <li v-for="item in recentApplications" :key="item.id" class="list-group-item">
              <div class="fw-semibold">{{ item.programTitle || 'Program' }}</div>
              <div class="small text-muted">{{ item.applicantName }} · {{ item.submittedAtLabel }}</div>
              <span :class="statusBadge(item.status)" class="mt-1">{{ item.status }}</span>
            </li>
          </ul>
          <div v-else class="card-body text-muted small">No applications yet.</div>
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
        <InteractiveTable
          :columns="approvedTableColumns"
          :rows="approvedTableRows"
          :page-size="10"
          row-key="id"
        >
          <template #cell-actions="{ row }">
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-secondary" disabled>Edit</button>
              <button class="btn btn-sm btn-outline-danger" @click="removeCourt(row.id)">Delete</button>
            </div>
          </template>
        </InteractiveTable>
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
            <label class="form-label">Suburb</label>
            <input v-model.trim="form.suburb" class="form-control" placeholder="e.g. Brunswick" required />
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
            <label class="form-label">Indoor</label>
            <select v-model="form.indoor" class="form-select">
              <option :value="true">Indoor</option>
              <option :value="false">Outdoor</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Cost</label>
            <input v-model.trim="form.cost" class="form-control" placeholder="Free / $8 per hour" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Opening Hours</label>
            <input v-model.trim="form.hours" class="form-control" placeholder="6am–10pm" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Tags (comma separated)</label>
            <input v-model.trim="tagsInput" class="form-control" placeholder="indoor, timber" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Surfaces (comma separated)</label>
            <input v-model.trim="surfacesInput" class="form-control" placeholder="Timber, Asphalt" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Latitude</label>
            <input v-model="form.lat" type="number" step="0.000001" class="form-control" placeholder="-37.8" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Longitude</label>
            <input v-model="form.lng" type="number" step="0.000001" class="form-control" placeholder="144.96" />
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

    <!-- Tab: Applications -->
    <div v-else-if="currentTab === 'applications'">
      <div class="card shadow-sm mb-4">
        <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span class="fw-semibold">Program Applications</span>
          <div class="btn-group" role="group" aria-label="Filter applications by status">
            <button
              class="btn btn-sm"
              :class="applicationFilter === 'pending' ? 'btn-primary' : 'btn-outline-primary'"
              @click="applicationFilter = 'pending'"
            >Pending</button>
            <button
              class="btn btn-sm"
              :class="applicationFilter === 'approved' ? 'btn-primary' : 'btn-outline-primary'"
              @click="applicationFilter = 'approved'"
            >Approved</button>
            <button
              class="btn btn-sm"
              :class="applicationFilter === 'rejected' ? 'btn-primary' : 'btn-outline-primary'"
              @click="applicationFilter = 'rejected'"
            >Rejected</button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="applicationsLoading" class="text-muted small">Loading applications…</div>
          <InteractiveTable
            v-else
            :columns="applicationColumns"
            :rows="currentApplicationRows"
            :page-size="10"
            row-key="id"
            :enable-global-search="true"
          >
            <template #cell-status="{ row }">
              <span :class="statusBadge(row.status)">{{ row.status }}</span>
            </template>
            <template #cell-actions="{ row }">
              <div class="d-flex justify-content-end gap-2">
                <button
                  class="btn btn-sm btn-success"
                  @click="moderateApplicationAction(row, 'approve')"
                  :disabled="row.status !== 'pending'"
                >
                  Approve
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click="moderateApplicationAction(row, 'reject')"
                  :disabled="row.status !== 'pending'"
                >
                  Reject
                </button>
              </div>
            </template>
          </InteractiveTable>
        </div>
      </div>
    </div>

    <!-- Tab: Emails -->
    <div v-else-if="currentTab === 'email'">
      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header fw-semibold">Recipients</div>
            <div class="card-body d-grid gap-3">
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-sm" :class="recipientRoleFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'" @click="recipientRoleFilter = 'all'">All</button>
                <button type="button" class="btn btn-sm" :class="recipientRoleFilter === 'user' ? 'btn-primary' : 'btn-outline-primary'" @click="recipientRoleFilter = 'user'">Users</button>
                <button type="button" class="btn btn-sm" :class="recipientRoleFilter === 'admin' ? 'btn-primary' : 'btn-outline-primary'" @click="recipientRoleFilter = 'admin'">Admins</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="selectAllRecipients(recipientRoleFilter)">Select {{ recipientRoleFilter === 'all' ? 'All' : recipientRoleFilter }}</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearRecipients">Clear</button>
              </div>
              <div class="recipient-list">
                <div v-if="userDirectoryLoading" class="text-muted small">Loading users…</div>
                <div v-else-if="!filteredUsers.length" class="text-muted small">No users found.</div>
                <ul v-else class="list-unstyled mb-0">
                  <li v-for="user in filteredUsers" :key="user.id" class="recipient-item">
                    <label class="form-check-label d-flex align-items-center gap-2">
                      <input class="form-check-input" type="checkbox" :checked="isRecipientSelected(user.email)" @change="toggleRecipient(user.email)" />
                      <span>
                        <div class="fw-semibold">{{ user.email }}</div>
                        <div class="small text-muted">{{ user.displayName || 'Unnamed' }} · {{ user.role }}</div>
                      </span>
                    </label>
                  </li>
                </ul>
              </div>
              <div class="small text-muted">Selected: {{ selectedRecipients.length ? selectedRecipients.join(', ') : 'None' }}</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-lg-6">
          <div class="card shadow-sm h-100">
            <div class="card-header fw-semibold">Recent Emails (session)</div>
            <div class="card-body">
              <p v-if="sentEmailLog.length === 0" class="text-muted mb-0">
                No emails sent during this session.
              </p>
              <ul v-else class="list-group list-group-flush">
                <li v-for="(item, idx) in sentEmailLog" :key="idx" class="list-group-item">
                  <div class="fw-semibold">{{ item.subject }}</div>
                  <div class="small text-muted">{{ item.to }} · {{ item.sentAt }}</div>
                  <div class="small">{{ item.message.slice(0, 140) }}<span v-if="item.message.length > 140">…</span></div>
                  <div class="small text-muted" v-if="item.attachmentName">Attachment: {{ item.attachmentName }}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-header fw-semibold">Compose Message</div>
            <form class="card-body d-grid gap-3" @submit.prevent="submitEmail($event)">
              <div>
                <label class="form-label">From (optional)</label>
                <input v-model.trim="emailForm.from" type="email" class="form-control" placeholder="Default server sender" />
                <div class="form-text">Leave blank to use the verified sender configured on the server.</div>
              </div>
              <div>
                <label class="form-label">Additional recipients (optional)</label>
                <input v-model.trim="emailForm.to" class="form-control" placeholder="Separate multiple emails with commas" />
              </div>
              <div class="small text-muted">Total recipients: {{ finalRecipients.length }}</div>
              <div>
                <label class="form-label">Subject</label>
                <input v-model.trim="emailForm.subject" class="form-control" required maxlength="140" />
              </div>
              <div>
                <label class="form-label">Message</label>
                <textarea v-model.trim="emailForm.message" class="form-control" rows="6" required maxlength="1200"></textarea>
              </div>
              <div>
                <label class="form-label">Attachment</label>
                <input :key="emailFileInputKey" class="form-control" type="file" @change="onAttachmentChange" />
                <div class="form-text">Optional attachment (max 10MB).</div>
                <div v-if="emailAttachmentName" class="small text-muted mt-1">
                  Selected: {{ emailAttachmentName }}
                </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-primary" :disabled="emailSending">
                  <span v-if="emailSending" class="spinner-border spinner-border-sm me-2"></span>
                  Send Email
                </button>
                <button type="button" class="btn btn-outline-secondary" @click="resetEmailForm({ keepFrom: false })" :disabled="emailSending">Reset</button>
              </div>
              <div v-if="emailError" class="alert alert-danger mb-0">{{ emailError }}</div>
              <div v-if="emailSuccess" class="alert alert-success mb-0">{{ emailSuccess }}</div>
            </form>
          </div>
        </div>
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
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
import { sendEmail } from '@/services/email'
import { useAuthState } from '@/state/authState'
import InteractiveTable from '@/components/InteractiveTable.vue'
import AdminAnalyticsChart from '@/components/AdminAnalyticsChart.vue'
import { fetchProgramApplications, moderateApplication } from '@/services/applications.js'
import { fetchAllUsers } from '@/services/users.js'
import { listProgramBookings } from '@/services/bookings.js'

// Router helpers
const route = useRoute()
const router = useRouter()
const { state: authState } = useAuthState()

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

const approvedTableColumns = [
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'address', label: 'Address', sortable: true, filterable: true },
  { key: 'hoops', label: 'Hoops', sortable: true, filterable: true, align: 'center' },
  { key: 'lightingLabel', label: 'Lighting', sortable: true, filterable: true, align: 'center' },
  {
    key: 'updatedLabel',
    label: 'Updated',
    sortable: true,
    filterable: true,
    sortAccessor: (row) => row.updatedSort || 0
  },
  { key: 'actions', label: 'Actions', sortable: false, filterable: false, align: 'right' }
]

// Create form
const form = reactive({
  name: '',
  address: '',
  suburb: '',
  hoops: 0,
  lighting: true,
  indoor: true,
  cost: '',
  hours: '',
  lat: '',
  lng: '',
  tags: [],
  surfaces: []
})
const tagsInput = ref('')
const surfacesInput = ref('')
const createLoading = ref(false)
const createErr = ref('')

// Announcements
const annForm = reactive({ title: '', content: '' })
const annList = ref([])
const annLoading = ref(false)
const annErr = ref('')

// Email centre
const emailForm = reactive({ from: '', to: '', subject: '', message: '' })
const emailAttachment = ref(null)
const emailFileInputKey = ref(0)
const emailSending = ref(false)
const emailError = ref('')
const emailSuccess = ref('')
const sentEmailLog = ref([])
const emailAttachmentName = computed(() => emailAttachment.value?.name || '')
const userDirectory = ref([])
const userDirectoryLoading = ref(false)
const recipientRoleFilter = ref('all')
const selectedRecipients = ref([])
const filteredUsers = computed(() => {
  if (recipientRoleFilter.value === 'all') return userDirectory.value
  return userDirectory.value.filter((user) => user.role === recipientRoleFilter.value)
})
const finalRecipients = computed(() => {
  const manual = (emailForm.to || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const set = new Set([...selectedRecipients.value, ...manual])
  return Array.from(set)
})

// Applications
const applicationFilter = ref('pending')
const applicationStore = reactive({
  pending: { items: [], loading: false },
  approved: { items: [], loading: false },
  rejected: { items: [], loading: false }
})
const allApplications = ref([])
const bookingOverview = ref([])
const applicationColumns = [
  { key: 'programTitle', label: 'Program', sortable: true, filterable: true },
  { key: 'applicantName', label: 'Applicant', sortable: true, filterable: true },
  { key: 'applicantEmail', label: 'Email', sortable: true, filterable: true },
  { key: 'age', label: 'Age', sortable: true, filterable: true, align: 'center' },
  { key: 'prefDate', label: 'Preferred Date', sortable: true, filterable: true },
  { key: 'submittedAtLabel', label: 'Submitted', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true },
  { key: 'actions', label: 'Actions', sortable: false, filterable: false, align: 'right' }
]
const currentApplicationRows = computed(() => {
  const store = applicationStore[applicationFilter.value] || { items: [] }
  return store.items
})
const applicationsLoading = computed(() => {
  const store = applicationStore[applicationFilter.value]
  return store?.loading || false
})
const applicationDatasets = computed(() => {
  const statusData = [
    { key: 'pending', label: 'Pending', value: applicationStore.pending.items.length, color: '#ffc107' },
    { key: 'approved', label: 'Approved', value: applicationStore.approved.items.length, color: '#198754' },
    { key: 'rejected', label: 'Rejected', value: applicationStore.rejected.items.length, color: '#dc3545' }
  ]

  const programTotals = new Map()
  allApplications.value.forEach((item) => {
    const key = item.programId || item.programTitle || 'unknown'
    const label = item.programTitle || 'Program'
    const current = programTotals.get(key) || { label, value: 0 }
    current.value += 1
    programTotals.set(key, current)
  })
  const programData = Array.from(programTotals.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      color: defaultProgramColor(index)
    }))

  const datasets = [
    { key: 'status', label: 'By Status', data: statusData },
    { key: 'program', label: 'Top Programs', data: programData }
  ]

  if (bookingOverview.value.length) {
    datasets.push({
      key: 'bookings',
      label: 'Bookings by Month',
      data: bookingOverview.value
    })
  }

  return datasets
})

const recentApplications = computed(() =>
  allApplications.value
    .slice()
    .sort((a, b) => (b.submittedAt?.getTime?.() || 0) - (a.submittedAt?.getTime?.() || 0))
    .slice(0, 5)
)

watch(
  () => authState?.user?.email,
  (email) => {
    if (email && !emailForm.from) {
      emailForm.from = email
    }
  },
  { immediate: true }
)

watch(applicationFilter, async (value) => {
  const store = applicationStore[value]
  if (store && store.items.length === 0) {
    await refreshApplications(true)
  }
})

// Navigation
function goTab(tab) {
  if (tab === 'courts')         router.push({ name: 'admin' })
  else if (tab === 'create')    router.push({ name: 'adminCreateCourt' })
  else if (tab === 'applications') router.push({ name: 'adminApplications' })
  else if (tab === 'email')     router.push({ name: 'adminEmails' })
  else                          router.push({ name: 'adminAnnouncements' })
}

function onAttachmentChange(event) {
  const file = event?.target?.files?.[0] || null
  emailAttachment.value = file
}

function resetEmailForm(options = {}) {
  const { clearAlerts = true, keepFrom = true } = options
  if (!keepFrom) emailForm.from = ''
  emailForm.to = ''
  emailForm.subject = ''
  emailForm.message = ''
  emailAttachment.value = null
  emailFileInputKey.value += 1
  if (clearAlerts) {
    emailError.value = ''
    emailSuccess.value = ''
  }
}

function isRecipientSelected(email) {
  return selectedRecipients.value.includes(email)
}

function toggleRecipient(email) {
  const list = selectedRecipients.value.slice()
  const index = list.indexOf(email)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.push(email)
  }
  selectedRecipients.value = list
}

function selectAllRecipients(role = 'all') {
  const users = role === 'all' ? userDirectory.value : userDirectory.value.filter((user) => user.role === role)
  selectedRecipients.value = Array.from(new Set([...selectedRecipients.value, ...users.map((u) => u.email).filter(Boolean)]))
}

function clearRecipients() {
  selectedRecipients.value = []
}

async function submitEmail(event) {
  const formEl = event?.target
  if (formEl && !formEl.reportValidity()) {
    return
  }
  emailError.value = ''
  emailSuccess.value = ''
  emailSending.value = true
  try {
    const recipients = finalRecipients.value
    if (recipients.length === 0) {
      emailError.value = 'Please choose at least one recipient.'
      emailSending.value = false
      return
    }
    const payload = new FormData()
    if (emailForm.from) payload.append('from', emailForm.from)
    payload.append('to', recipients.join(','))
    payload.append('subject', emailForm.subject)
    payload.append('message', emailForm.message)
    if (emailAttachment.value) {
      payload.append('attachment', emailAttachment.value, emailAttachment.value.name)
    }

    await sendEmail(payload)
    emailSuccess.value = 'Email sent successfully.'

    sentEmailLog.value.unshift({
      to: recipients.join(', '),
      subject: emailForm.subject,
      message: emailForm.message,
      sentAt: new Date().toLocaleString(),
      attachmentName: emailAttachment.value?.name || ''
    })
    if (sentEmailLog.value.length > 20) {
      sentEmailLog.value.splice(20)
    }

    resetEmailForm({ clearAlerts: false, keepFrom: true })
  } catch (e) {
    emailError.value = e?.message || 'Failed to send email.'
  } finally {
    emailSending.value = false
  }
}

async function refreshApplications(force = false) {
  if (!force && allApplications.value.length > 0) return
  Object.values(applicationStore).forEach((store) => {
    store.loading = true
  })
  try {
    const list = await fetchProgramApplications('all')
    allApplications.value = list
    const grouped = {
      pending: [],
      approved: [],
      rejected: []
    }
    list.forEach((item) => {
      const status = (item.status || 'pending').toLowerCase()
      const target = grouped[status] || grouped.pending
      target.push(formatApplicationRow(item))
    })
    Object.entries(grouped).forEach(([key, value]) => {
      if (applicationStore[key]) {
        applicationStore[key].items = value
        applicationStore[key].loading = false
      }
    })
  } catch (err) {
    console.error('Failed to load applications', err)
    alert(err?.message || 'Failed to load applications.')
    Object.values(applicationStore).forEach((store) => {
      store.loading = false
    })
  }
}

function statusBadge(status) {
  const value = (status || '').toLowerCase()
  if (value === 'approved') return 'badge text-bg-success text-uppercase'
  if (value === 'rejected') return 'badge text-bg-danger text-uppercase'
  return 'badge text-bg-warning text-uppercase'
}

function defaultProgramColor(index) {
  const palette = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6610f2', '#20c997']
  return palette[index % palette.length]
}

function formatApplicationRow(item) {
  return {
    ...item,
    submittedAtLabel: formatTableDate(item.submittedAt) || '',
    processedAtLabel: item.processedAt ? formatTableDate(item.processedAt) : '',
    actions: ''
  }
}

async function moderateApplicationAction(row, action) {
  const confirmMsg =
    action === 'approve'
      ? `Approve ${row.applicantName} for ${row.programTitle}?`
      : `Reject ${row.applicantName} for ${row.programTitle}?`

  if (!window.confirm(confirmMsg)) return
  let note = ''
  if (action === 'reject') {
    note = window.prompt('Optional reason for rejection (max 400 chars):', row.decisionNote || '') || ''
  }

  try {
    await moderateApplication(row.id, action, note)
    alert(action === 'approve' ? 'Application approved.' : 'Application rejected.')
    await refreshApplications(true)
  } catch (err) {
    console.error('moderateApplicationAction failed', err)
    alert(err?.message || 'Failed to update application.')
  }
}

// Format Firestore timestamp or date
function formatTs(ts) {
  try {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleString()
  } catch { return '' }
}

function formatTableDate(ts) {
  try {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function getTableDateSort(ts) {
  try {
    if (!ts) return 0
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const time = d.getTime()
    return Number.isNaN(time) ? 0 : time
  } catch {
    return 0
  }
}

const approvedTableRows = computed(() => approved.items.map((item) => ({
  id: item.id,
  name: item.name || '',
  address: item.address || '',
  hoops: item.hoops ?? 0,
  lightingLabel: item.lighting ? 'Yes' : 'No',
  updatedLabel: formatTableDate(item.updatedAt),
  updatedSort: getTableDateSort(item.updatedAt),
  actions: ''
})))

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
  form.name = ''
  form.address = ''
  form.suburb = ''
  form.hoops = 0
  form.lighting = true
  form.indoor = true
  form.cost = ''
  form.hours = ''
  form.lat = ''
  form.lng = ''
  form.tags = []
  form.surfaces = []
  tagsInput.value = ''
  surfacesInput.value = ''
  createErr.value = ''
}

// Create new court
async function submitCreate() {
  createErr.value = ''
  createLoading.value = true
  try {
    const tags = (tagsInput.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const surfaces = (surfacesInput.value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const latNum = Number(form.lat)
    const lngNum = Number(form.lng)

    const payload = {
      ...form,
      tags,
      surfaces,
      lights: form.lighting,
      lat: Number.isFinite(latNum) ? latNum : null,
      lng: Number.isFinite(lngNum) ? lngNum : null,
      hoops: Number(form.hoops) || 0
    }

    await createCourt(payload)
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

async function loadUsers() {
  userDirectoryLoading.value = true
  try {
    userDirectory.value = (await fetchAllUsers()).filter((user) => !!user.email)
  } catch (err) {
    console.error('Failed to load users', err)
  } finally {
    userDirectoryLoading.value = false
  }
}

async function loadBookingsOverview() {
  try {
    const { bookings: list } = await listProgramBookings({ scope: 'all' })
    const map = new Map()
    ;(list || []).forEach((booking) => {
      const date = new Date(booking.start)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleString(undefined, { month: 'short', year: 'numeric' })
      const current = map.get(key) || { label, value: 0, color: '#0d6efd' }
      current.value += 1
      map.set(key, current)
    })
    bookingOverview.value = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
  } catch (err) {
    console.error('Failed to load bookings overview', err)
    bookingOverview.value = []
  }
}

// Initial load
onMounted(async () => {
  await loadKpi()
  await Promise.all([loadApproved(), loadAnnouncements()])
  await refreshApplications(true)
  await loadBookingsOverview()
  await loadUsers()
})
</script>

<style scoped>
.nav-pills .btn { min-width: 9rem; }
.table td, .table th { vertical-align: middle; }
.recipient-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  padding: 0.75rem;
  background: #f8fafc;
}
.recipient-item + .recipient-item {
  margin-top: 0.5rem;
}
</style>
