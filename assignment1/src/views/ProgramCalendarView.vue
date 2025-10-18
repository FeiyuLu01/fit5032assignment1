<template>
  <section class="container py-4 calendar-view">
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
      <div>
        <h2 class="h4 fw-bold text-primary mb-0">Program Calendar</h2>
        <p class="text-muted mb-0">Select a session to book your spot. Each day shows available programs from the club schedule.</p>
      </div>
      <div class="btn-group" role="group" aria-label="Change month">
        <button type="button" class="btn btn-outline-primary" @click="prevMonth">«</button>
        <button type="button" class="btn btn-primary" disabled>{{ monthLabel }}</button>
        <button type="button" class="btn btn-outline-primary" @click="nextMonth">»</button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-12 col-xl-9">
        <div class="calendar-grid">
          <div class="calendar-header" v-for="day in weekdayLabels" :key="day">{{ day }}</div>
          <div
            v-for="cell in calendarCells"
            :key="cell.key"
            class="calendar-cell"
            :class="{ 'is-today': cell.isToday, empty: !cell.date }"
          >
            <div class="cell-date" v-if="cell.date">{{ cell.date.getDate() }}</div>
            <div class="cell-content" v-if="cell.date">
              <div
                v-for="event in cell.events"
                :key="event.id"
                class="calendar-event"
              >
                <button
                  v-if="event.type === 'session'"
                  type="button"
                  class="btn btn-sm btn-outline-primary w-100 text-start"
                  @click="openBooking(event)"
                >
                  <div class="fw-semibold">{{ event.title }}</div>
                  <div class="small text-muted">{{ event.timeLabel }}</div>
                </button>
                <div v-else class="booking-pill">
                  <div class="fw-semibold">{{ event.title }}</div>
                  <div class="small text-muted">{{ event.timeLabel }}</div>
                  <span class="badge bg-success text-uppercase">{{ event.status }}</span>
                </div>
              </div>
              <div v-if="cell.events.length === 0" class="text-muted small">No sessions</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-3">
        <div class="card shadow-sm mb-4">
          <div class="card-header fw-semibold">My Bookings</div>
          <ul class="list-group list-group-flush" v-if="myBookings.length">
            <li v-for="item in myBookings" :key="item.id" class="list-group-item">
              <div class="fw-semibold">{{ item.programTitle }}</div>
              <div class="small text-muted">{{ item.startLabel }}</div>
              <span class="badge bg-success">{{ item.status }}</span>
            </li>
          </ul>
          <div v-else class="card-body text-muted small">No bookings yet.</div>
        </div>
        <div class="card shadow-sm">
          <div class="card-header fw-semibold">Booking tips</div>
          <div class="card-body small text-muted">
            <ul class="mb-0 ps-3">
              <li>Sessions are limited; once full you will not be able to book that timeslot.</li>
              <li>You cannot hold two bookings at the same start time.</li>
              <li>Use the calendar buttons above to browse other months.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-if="dialog.open" class="booking-dialog" role="dialog" aria-modal="true">
      <div class="dialog-backdrop" @click="closeDialog"></div>
      <div class="dialog-card">
        <div class="dialog-header d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">Book session</h5>
            <p class="mb-0 text-muted">{{ dialog.event?.title }} · {{ dialog.event?.dateLabel }}</p>
          </div>
          <button type="button" class="btn-close" @click="closeDialog" aria-label="Close"></button>
        </div>
        <form class="dialog-body d-grid gap-3" @submit.prevent="confirmBooking">
          <div>
            <label class="form-label">Choose Time</label>
            <select v-model="dialog.selectedTime" class="form-select" required>
              <option disabled value="">Select a time</option>
              <option v-for="slot in dialog.event?.timeOptions || []" :key="slot" :value="slot">
                {{ slot }}
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" rows="2" v-model.trim="dialog.note" maxlength="200"></textarea>
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" :disabled="dialog.submitting">
              <span v-if="dialog.submitting" class="spinner-border spinner-border-sm me-2"></span>
              Confirm Booking
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="closeDialog" :disabled="dialog.submitting">Cancel</button>
          </div>
          <div v-if="dialog.error" class="alert alert-danger mb-0">{{ dialog.error }}</div>
          <div v-if="dialog.success" class="alert alert-success mb-0">{{ dialog.success }}</div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { fetchPrograms } from '@/services/data'
import { bookProgramSlot, listProgramBookings } from '@/services/bookings'
import { formatDateISOToDMY } from '@/utils/format'
import { useAuthState } from '@/state/authState'

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const programs = ref([])
const bookings = ref([])
const loadingPrograms = ref(false)
const loadingBookings = ref(false)
const { state: authState } = useAuthState()

const dialog = reactive({
  open: false,
  event: null,
  selectedTime: '',
  note: '',
  submitting: false,
  error: '',
  success: ''
})

// Calendar headings for the grid layout.
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' })
})

// Build the grid cells for the current month, mixing program sessions and
// personal bookings so the user can see both availability and their own schedule.
const calendarCells = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const startIdx = firstDay.getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  const eventsByDate = groupEventsByDate()
  const cells = []
  const totalCells = Math.ceil((startIdx + daysInMonth) / 7) * 7

  for (let i = 0; i < totalCells; i += 1) {
    const dayNumber = i - startIdx + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push({ key: `empty-${i}`, date: null, events: [], isToday: false })
      continue
    }
    const date = new Date(currentYear.value, currentMonth.value, dayNumber)
    const key = dateKey(date)
    cells.push({
      key,
      date,
      events: eventsByDate.get(key) || [],
      isToday: isSameDate(date, today)
    })
  }
  return cells
})

const myBookings = computed(() =>
  bookings.value
    .map((item) => ({
      ...item,
      startLabel: formatReadableDate(item.start)
    }))
    .sort((a, b) => (safeDate(a.start)?.getTime?.() || 0) - (safeDate(b.start)?.getTime?.() || 0))
)

// Returns a Map keyed by local date (YYYY-MM-DD) containing the sessions that
// can be booked as well as the user's own approved bookings.
function groupEventsByDate() {
  const map = new Map()

  function addEvent(key, event) {
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(event)
  }

  programs.value.forEach((program) => {
    if (!program.date) return
    const dateObj = safeDate(program.date)
    if (!dateObj) return
    const key = dateKey(dateObj)
    const timeOptions = program.timeSlots || ['10:00', '14:00']
    addEvent(key, {
      id: `${program.id}-${key}`,
      type: 'session',
      programId: program.id,
      title: program.title,
      date: dateObj,
      dateLabel: formatDateISOToDMY(key),
      timeOptions,
      timeLabel: timeOptions.join(' / ')
    })
  })

  bookings.value.forEach((booking) => {
    const dateObj = safeDate(booking.start)
    if (!dateObj) return
    const key = dateKey(dateObj)
    addEvent(key, {
      id: `booking-${booking.id}`,
      type: 'booking',
      programId: booking.programId || null,
      title: booking.programTitle || 'Booking',
      date: dateObj,
      dateLabel: formatDateISOToDMY(key),
      timeOptions: [],
      timeLabel: dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      status: booking.status || 'approved'
    })
  })

  return map
}

// Normalise date-like values (plain string, Date or Firestore Timestamp).
function safeDate(input) {
  if (!input) return null
  if (input instanceof Date) return input
  if (input && typeof input.toDate === 'function') {
    const d = input.toDate()
    if (!Number.isNaN(d.getTime())) return d
  }
  if (typeof input === 'object') {
    const seconds = input.seconds ?? input._seconds
    const nanos = input.nanoseconds ?? input._nanoseconds
    if (typeof seconds === 'number') {
      const date = new Date(seconds * 1000 + (typeof nanos === 'number' ? nanos / 1e6 : 0))
      if (!Number.isNaN(date.getTime())) return date
    }
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function dateKey(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatReadableDate(value) {
  try {
    const date = safeDate(value)
    if (!date) return String(value)
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(value)
  }
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
}

function openBooking(event) {
  dialog.open = true
  dialog.event = event
  dialog.selectedTime = event.timeOptions?.[0] || ''
  dialog.note = ''
  dialog.error = ''
  dialog.success = ''
}

function closeDialog() {
  dialog.open = false
  dialog.event = null
  dialog.selectedTime = ''
  dialog.note = ''
  dialog.error = ''
  dialog.success = ''
}

async function confirmBooking() {
  if (!dialog.event || !dialog.selectedTime) return
  if (!authState.user) {
    dialog.error = 'Please sign in to book a session.'
    return
  }

  dialog.submitting = true
  dialog.error = ''
  dialog.success = ''
  try {
    const dateIso = `${dialog.event.date.toISOString().slice(0, 10)}T${dialog.selectedTime}:00`
    await bookProgramSlot({
      programId: dialog.event.programId,
      start: dateIso,
      note: dialog.note
    })
    dialog.success = 'Booking confirmed!'
    await loadBookings()
  } catch (err) {
    console.error('Booking failed', err)
    dialog.error = err?.message || 'Failed to create booking.'
  } finally {
    dialog.submitting = false
  }
}

async function loadPrograms() {
  loadingPrograms.value = true
  try {
    const list = await fetchPrograms()
    programs.value = (list || []).filter((item) => item.date)
  } catch (err) {
    console.error('Failed to load programs', err)
    programs.value = []
  } finally {
    loadingPrograms.value = false
  }
}

async function loadBookings() {
  if (!authState.user) {
    bookings.value = []
    return
  }
  loadingBookings.value = true
  try {
    const { bookings: list } = await listProgramBookings({ scope: 'self' })
    bookings.value = (list || []).map((item) => ({
      ...item,
      start: safeDate(item.start) || item.start
    }))
  } catch (err) {
    console.error('Failed to load bookings', err)
    bookings.value = []
  } finally {
    loadingBookings.value = false
  }
}

onMounted(async () => {
  await loadPrograms()
  await loadBookings()
})

</script>

<style scoped>
.calendar-view .calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: #f8fafc;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 16px;
  overflow: hidden;
}
.calendar-header {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  background: #0d6efd;
  color: #fff;
  border-right: 1px solid rgba(255,255,255,0.2);
}
.calendar-header:last-child {
  border-right: none;
}
.calendar-cell {
  min-height: 140px;
  border-right: 1px solid rgba(0,0,0,0.05);
  border-top: 1px solid rgba(0,0,0,0.05);
  padding: 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.calendar-cell.empty {
  background: #f1f5f9;
}
.calendar-cell.is-today {
  box-shadow: inset 0 0 0 2px #0d6efd;
}
.cell-date {
  font-weight: 600;
  color: #0f172a;
}
.calendar-event .btn {
  font-size: 0.85rem;
}
.calendar-event + .calendar-event {
  margin-top: 0.5rem;
}
.booking-pill {
  border: 1px solid rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.1);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
}
.booking-pill {
  border: 1px solid rgba(16, 185, 129, 0.35);
  background: rgba(16, 185, 129, 0.1);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
}
.booking-dialog {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
}
.dialog-card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  width: min(520px, calc(100% - 2rem));
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
}
.dialog-header {
  margin-bottom: 1rem;
}
</style>
