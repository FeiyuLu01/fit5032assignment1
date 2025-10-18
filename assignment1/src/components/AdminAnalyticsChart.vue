<template>
  <div class="analytics-chart">
    <div class="chart-toolbar">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        class="btn btn-sm"
        :class="current.key === option.key ? 'btn-primary' : 'btn-outline-primary'"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="chart-canvas-wrapper">
      <canvas
        ref="canvasRef"
        height="220"
        role="img"
        :aria-label="`Chart showing ${current.label} distribution`"
      ></canvas>
    </div>

    <div class="chart-legend" v-if="current.data.length">
      <div
        v-for="item in current.data"
        :key="item.label"
        class="legend-item"
      >
        <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
        <span class="legend-label">{{ item.label }}</span>
        <span class="legend-value">{{ item.value }}</span>
      </div>
    </div>
    <div v-else class="text-muted small py-2">No data available.</div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  datasets: {
    type: Array,
    default: () => []
  }
})

const options = computed(() =>
  props.datasets.map((item, idx) => ({
    key: item.key || `dataset-${idx}`,
    label: item.label || `Dataset ${idx + 1}`,
    data: Array.isArray(item.data) ? item.data : []
  }))
)

const canvasRef = ref(null)
const currentKey = ref(options.value[0]?.key || null)
let ctx = null

const current = computed(() => {
  const found = options.value.find((opt) => opt.key === currentKey.value)
  return (
    found || {
      key: 'empty',
      label: 'Empty',
      data: []
    }
  )
})

function selectOption(option) {
  currentKey.value = option.key
}

function drawChart() {
  if (!ctx) return
  const { data } = current.value
  const padding = 32
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  ctx.clearRect(0, 0, width, height)

  if (!data.length) {
    ctx.fillStyle = '#adb5bd'
    ctx.font = '14px sans-serif'
    ctx.fillText('No data', padding, height / 2)
    return
  }

  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1)
  const barHeight = Math.min(48, (height - padding) / data.length - 12)
  const gap = 12

  ctx.font = '14px sans-serif'
  ctx.textBaseline = 'middle'

  data.forEach((item, index) => {
    const value = Number(item.value) || 0
    const y = padding / 2 + index * (barHeight + gap)
    const barWidth = ((width - padding * 2) * value) / maxValue

    ctx.fillStyle = item.color || defaultColor(index)
    drawRoundedRect(ctx, padding, y, Math.max(barWidth, 4), barHeight, 6)
    ctx.fill()

    ctx.fillStyle = '#1f2933'
    ctx.fillText(item.label, padding + 8, y + barHeight / 2)

    ctx.fillStyle = '#0a58ca'
    const text = String(item.value)
    const textWidth = ctx.measureText(text).width
    const textX = barWidth > textWidth + 24 ? padding + barWidth - textWidth - 8 : padding + barWidth + 8
    ctx.fillText(text, textX, y + barHeight / 2)
  })
}

function defaultColor(index) {
  const palette = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6610f2', '#20c997']
  return palette[index % palette.length]
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    return
  }
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function handleResize() {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  canvasRef.value.width = rect.width * window.devicePixelRatio
  canvasRef.value.height = 220 * window.devicePixelRatio
  ctx = canvasRef.value.getContext('2d')
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  drawChart()
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    handleResize()
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

watch(options, () => {
  if (!options.value.find((opt) => opt.key === currentKey.value)) {
    currentKey.value = options.value[0]?.key || null
  }
  handleResize()
})

watch(current, () => {
  drawChart()
})
</script>

<style scoped>
.analytics-chart {
  display: grid;
  gap: 1rem;
}
.chart-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chart-canvas-wrapper {
  width: 100%;
  overflow: hidden;
}
.chart-legend {
  display: grid;
  gap: 0.5rem;
}
.legend-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.9rem;
}
.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
.legend-label {
  flex: 1;
  color: #334155;
}
.legend-value {
  font-weight: 600;
  color: #0f172a;
}
</style>
