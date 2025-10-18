<template>
  <div class="interactive-table">
    <div v-if="enableGlobalSearch" class="table-tool mb-3">
      <input
        v-model.trim="globalFilter"
        type="search"
        class="form-control"
        placeholder="Search all columns"
        @input="onFiltersChanged"
      />
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="headerClass(col)"
              role="columnheader"
              scope="col"
              @click="col.sortable ? toggleSort(col.key) : null"
            >
              <span class="d-inline-flex align-items-center gap-1">
                {{ col.label }}
                <span v-if="col.sortable" class="sort-indicator">
                  <span v-if="sortState.key !== col.key">⇅</span>
                  <span v-else-if="sortState.direction === 'asc'">↑</span>
                  <span v-else>↓</span>
                </span>
              </span>
            </th>
          </tr>
          <tr class="table-filters">
            <th v-for="col in columns" :key="`${col.key}-filter`">
              <input
                v-if="col.filterable"
                v-model="columnFilters[col.key]"
                type="search"
                class="form-control form-control-sm"
                placeholder="Filter"
                @input="onFiltersChanged"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRows.length === 0">
            <td :colspan="columns.length" class="text-center text-muted py-4">No matching records.</td>
          </tr>
          <tr
            v-for="(row, rowIndex) in paginatedRows"
            :key="rowKeyValue(row, rowIndex)"
          >
            <td
              v-for="col in columns"
              :key="`${rowKeyValue(row, rowIndex)}-${col.key}`"
              :class="cellClass(col)"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="getDisplayValue(row, col)">
                {{ formatValue(row, col) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div class="small text-muted">
        Showing {{ startEntry }}–{{ endEntry }} of {{ filteredCount }} entries
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" :disabled="currentPage === 1" @click="goPrev">
          Prev
        </button>
        <div class="d-flex align-items-center gap-1">
          <button
            v-for="page in pageNumbers"
            :key="page"
            class="btn btn-sm"
            :class="page === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
            @click="goPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button class="btn btn-outline-secondary btn-sm" :disabled="currentPage === totalPages" @click="goNext">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    validator: (cols) => cols.every(col => col.key && col.label)
  },
  rows: {
    type: Array,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  enableGlobalSearch: {
    type: Boolean,
    default: true
  }
})

const columnFilters = reactive({})
const globalFilter = ref('')
const currentPage = ref(1)
const sortState = reactive({
  key: null,
  direction: 'asc'
})

// Initialise filters when columns change
watch(
  () => props.columns,
  (cols) => {
    const keys = cols.map(col => col.key)
    Object.keys(columnFilters).forEach((key) => {
      if (!keys.includes(key)) {
        delete columnFilters[key]
      }
    })
    cols.forEach(col => {
      if (!(col.key in columnFilters)) {
        columnFilters[col.key] = ''
      }
    })
  },
  { immediate: true }
)

// Reset page when data set changes
watch(
  () => props.rows,
  () => {
    currentPage.value = 1
  }
)

const filteredRows = computed(() => {
  const globalQ = globalFilter.value.trim().toLowerCase()

  return props.rows.filter((row) => {
    for (const col of props.columns) {
      const query = (columnFilters[col.key] || '').trim().toLowerCase()
      if (query) {
        const candidate = getFilterValue(row, col).toLowerCase()
        if (!candidate.includes(query)) {
          return false
        }
      }
    }

    if (!globalQ) return true

    return props.columns.some((col) => getFilterValue(row, col).toLowerCase().includes(globalQ))
  })
})

const sortedRows = computed(() => {
  if (!sortState.key) {
    return filteredRows.value.slice()
  }
  const sortCol = props.columns.find(col => col.key === sortState.key)
  if (!sortCol) {
    return filteredRows.value.slice()
  }
  const multiplier = sortState.direction === 'asc' ? 1 : -1
  return filteredRows.value.slice().sort((a, b) => {
    let av = getSortValue(a, sortCol)
    let bv = getSortValue(b, sortCol)

    if (av instanceof Date) av = av.getTime()
    if (bv instanceof Date) bv = bv.getTime()

    if (av === bv) return 0
    if (av === undefined || av === null) return -1 * multiplier
    if (bv === undefined || bv === null) return 1 * multiplier

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * multiplier
    }
    const aStr = String(av).toLowerCase()
    const bStr = String(bv).toLowerCase()
    return aStr.localeCompare(bStr) * multiplier
  })
})

const filteredCount = computed(() => filteredRows.value.length)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCount.value / props.pageSize)))

watch([filteredRows, () => props.pageSize], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

const startEntry = computed(() => {
  if (filteredCount.value === 0) return 0
  return (currentPage.value - 1) * props.pageSize + 1
})

const endEntry = computed(() => {
  return Math.min(currentPage.value * props.pageSize, filteredCount.value)
})

const pageNumbers = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

function headerClass(col) {
  return [
    col.sortable ? 'sortable' : '',
    col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''
  ]
}

function cellClass(col) {
  return [
    col.align === 'right' ? 'text-end' : '',
    col.align === 'center' ? 'text-center' : ''
  ]
}

function rowKeyValue(row, index) {
  if (props.rowKey && row[props.rowKey] !== undefined) {
    return row[props.rowKey]
  }
  return index
}

function toggleSort(key) {
  if (sortState.key === key) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.key = key
    sortState.direction = 'asc'
  }
}

function goPrev() {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

function goNext() {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

function goPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function onFiltersChanged() {
  currentPage.value = 1
}

function getCellRawValue(row, col) {
  if (typeof col.valueAccessor === 'function') {
    return col.valueAccessor(row, col)
  }
  return row[col.key]
}

function getDisplayValue(row, col) {
  if (typeof col.displayAccessor === 'function') {
    return col.displayAccessor(row, col)
  }
  if (col.displayKey && row[col.displayKey] !== undefined) {
    return row[col.displayKey]
  }
  return getCellRawValue(row, col)
}

function getFilterValue(row, col) {
  if (typeof col.filterAccessor === 'function') {
    const value = col.filterAccessor(row, col)
    return value === undefined || value === null ? '' : String(value)
  }
  const fallback = getDisplayValue(row, col)
  return fallback === undefined || fallback === null ? '' : String(fallback)
}

function getSortValue(row, col) {
  if (typeof col.sortAccessor === 'function') {
    return col.sortAccessor(row, col)
  }
  return getCellRawValue(row, col)
}

function formatValue(row, col) {
  const value = getDisplayValue(row, col)
  if (typeof col.format === 'function') {
    return col.format(value, col, row)
  }
  return value ?? ''
}
</script>

<style scoped>
.interactive-table .table {
  margin-bottom: 0;
}

.interactive-table .table thead th.sortable {
  cursor: pointer;
  user-select: none;
}

.interactive-table .table thead th.sortable:hover {
  background: rgba(13, 110, 253, 0.05);
}

.interactive-table .table-filters input {
  min-width: 120px;
}

.interactive-table .sort-indicator {
  font-size: 0.75rem;
  color: #6c757d;
}
</style>
