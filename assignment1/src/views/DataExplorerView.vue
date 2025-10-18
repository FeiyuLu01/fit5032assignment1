<template>
  <section class="container py-4 data-explorer">
    <div class="mb-4">
      <h2 class="h4 fw-bold text-primary">Data Explorer</h2>
      <p class="text-muted mb-0">
        Use the interactive tables below to sort, search and filter our programs and court facilities.
      </p>
    </div>

    <div class="card shadow-sm border-0 rounded-3 mb-4">
      <div class="card-header d-flex justify-content-between align-items-center fw-semibold">
        <span>Programs Overview</span>
        <!-- Export button meets BR E.4 data export requirement -->
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="exportPrograms"
          :disabled="programsLoading || programRows.length === 0"
        >
          Export CSV
        </button>
      </div>
      <div class="card-body">
        <div v-if="programsLoading" class="text-center text-muted py-4">Loading programs…</div>
        <!-- Interactive table satisfies BR D.3 with sorting/filtering/pagination -->
        <InteractiveTable
          v-else
          :columns="programColumns"
          :rows="programRows"
          :page-size="10"
          row-key="id"
        />
      </div>
    </div>

    <div class="card shadow-sm border-0 rounded-3">
      <div class="card-header d-flex justify-content-between align-items-center fw-semibold">
        <span>Courts Inventory</span>
        <!-- Export button meets BR E.4 for courts dataset -->
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="exportCourts"
          :disabled="courtsLoading || courtRows.length === 0"
        >
          Export CSV
        </button>
      </div>
      <div class="card-body">
        <div v-if="courtsLoading" class="text-center text-muted py-4">Loading courts…</div>
        <InteractiveTable
          v-else
          :columns="courtColumns"
          :rows="courtRows"
          :page-size="10"
          row-key="id"
        >
          <template #cell-lightsLabel="{ value }">
            <span :class="value === 'Yes' ? 'text-success fw-semibold' : 'text-muted'">{{ value }}</span>
          </template>
        </InteractiveTable>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import InteractiveTable from '@/components/InteractiveTable.vue'
import { fetchPrograms, fetchCourts } from '@/services/data'
import { formatDateISOToDMY } from '@/utils/format'

const programsLoading = ref(false)
const courtsLoading = ref(false)
const programsRaw = ref([])
const courtsRaw = ref([])

const programColumns = [
  { key: 'title', label: 'Program', sortable: true, filterable: true },
  { key: 'level', label: 'Level', sortable: true, filterable: true },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    filterable: true,
    align: 'right',
    format: (_value, _col, row) => formatPrice(row.price),
    filterAccessor: (row) => formatPrice(row.price).toLowerCase(),
    sortAccessor: (row) => Number(row.price ?? 0)
  },
  {
    key: 'dateLabel',
    label: 'Date',
    sortable: true,
    filterable: true,
    sortAccessor: (row) => {
      const time = Date.parse(row.dateValue)
      return Number.isNaN(time) ? 0 : time
    }
  },
  { key: 'location', label: 'Location', sortable: true, filterable: true }
]

const courtColumns = [
  { key: 'name', label: 'Court', sortable: true, filterable: true },
  { key: 'suburb', label: 'Suburb', sortable: true, filterable: true },
  { key: 'indoorLabel', label: 'Indoor', sortable: true, filterable: true, align: 'center' },
  { key: 'lightsLabel', label: 'Lights', sortable: true, filterable: true, align: 'center' },
  { key: 'cost', label: 'Cost', sortable: true, filterable: true, align: 'right' },
  { key: 'hours', label: 'Hours', sortable: true, filterable: true }
]

const programRows = computed(() =>
  programsRaw.value.map((item) => ({
    id: item.id,
    title: item.title,
    level: item.level,
    price: Number(item.price ?? 0),
    dateLabel: formatDateISOToDMY(item.date),
    dateValue: item.date,
    location: item.location
  }))
)

const courtRows = computed(() =>
  courtsRaw.value.map((item) => ({
    id: item.id,
    name: item.name,
    suburb: item.suburb,
    indoorLabel: item.indoor ? 'Yes' : 'No',
    lightsLabel: item.lights ? 'Yes' : 'No',
    cost: item.cost,
    hours: item.hours
  }))
)

function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '$0.00'
  return num === 0 ? 'Free' : `$${num.toFixed(2)}`
}

function csvValue(value) {
  const str = value == null ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function downloadCsv(filename, headers, rows) {
  const csvLines = [headers.map(csvValue).join(',')]
  rows.forEach((row) => {
    csvLines.push(row.map(csvValue).join(','))
  })
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

function exportPrograms() {
  if (!programRows.value.length) return
  const headers = ['Program', 'Level', 'Price', 'Date', 'Location']
  const rows = programRows.value.map((row) => [
    row.title,
    row.level,
    formatPrice(row.price),
    row.dateLabel,
    row.location
  ])
  downloadCsv('programs.csv', headers, rows)
}

function exportCourts() {
  if (!courtRows.value.length) return
  const headers = ['Court', 'Suburb', 'Indoor', 'Lights', 'Cost', 'Hours']
  const rows = courtRows.value.map((row) => [
    row.name,
    row.suburb,
    row.indoorLabel,
    row.lightsLabel,
    row.cost,
    row.hours
  ])
  downloadCsv('courts.csv', headers, rows)
}

onMounted(async () => {
  try {
    programsLoading.value = true
    courtsLoading.value = true
    const [programList, courtList] = await Promise.all([fetchPrograms(), fetchCourts()])
    programsRaw.value = Array.isArray(programList) ? programList : []
    courtsRaw.value = Array.isArray(courtList) ? courtList : []
  } finally {
    programsLoading.value = false
    courtsLoading.value = false
  }
})
</script>

<style scoped>
.data-explorer .card + .card {
  margin-top: 1.5rem;
}
</style>
