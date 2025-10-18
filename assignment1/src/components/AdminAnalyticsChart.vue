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
let dprRef = 1 // ✅ 统一缓存 DPR，避免刷新瞬间取值不一致

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
  if (!ctx || !canvasRef.value) return
  const { data } = current.value

  // ✅ 使用 CSS 尺寸更稳：避免 DPR 抖动带来的计算偏差
  const rect = canvasRef.value.getBoundingClientRect()
  const width = rect.width || canvasRef.value.width / dprRef
  const height = rect.height || canvasRef.value.height / dprRef

  const padding = 32
  const labelWidth = 100
  ctx.clearRect(0, 0, width, height)

  if (!data.length) {
    ctx.fillStyle = '#adb5bd'
    ctx.font =
      '14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
    ctx.fillText('No data', padding, height / 2)
    return
  }

  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1)
  const barHeight = Math.min(40, (height - padding) / data.length - 16)
  const gap = 12

  ctx.font =
    '14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
  ctx.textBaseline = 'middle'

  // Baseline
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding + labelWidth, padding / 2)
  ctx.lineTo(padding + labelWidth, height - padding / 2)
  ctx.stroke()

  data.forEach((item, index) => {
    const value = Number(item.value) || 0
    const y = padding / 2 + index * (barHeight + gap)
    const barX = padding + labelWidth + 8

    // ✅ 完全自适应的可用宽度（留 60 给右侧数字）
    const availableWidth = Math.max(0, width - padding * 2 - labelWidth - 60)
    const barWidth = (availableWidth * value) / maxValue

    // 背景轨道（灰色）
    ctx.fillStyle = 'rgba(148, 163, 184, 0.16)'
    drawRoundedRect(ctx, barX, y, availableWidth, barHeight, 6)
    ctx.fill()

    // 实际柱状条
    ctx.fillStyle = item.color || defaultColor(index)
    drawRoundedRect(ctx, barX, y, Math.max(barWidth, 4), barHeight, 6)
    ctx.fill()

    // 左侧标签
    ctx.fillStyle = '#1f2933'
    ctx.textAlign = 'right'
    ctx.fillText(item.label, padding + labelWidth - 12, y + barHeight / 2)

    // 数值靠右显示
    ctx.fillStyle = '#0a58ca'
    ctx.textAlign = 'left'
    const text = String(item.value)
    const textWidth = ctx.measureText(text).width
    const textX = Math.min(width - textWidth - 16, barX + barWidth + 8)
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

// ✅ 自动高度 + 刷新稳健（统一 DPR、避免 0 宽）
function handleResize() {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  if (!rect.width) {
    // 如果还没拿到布局宽度，下一帧再试（避免刷新时 0 宽导致后续计算异常）
    requestAnimationFrame(handleResize)
    return
  }

  dprRef = (window.devicePixelRatio && window.devicePixelRatio > 0) ? window.devicePixelRatio : 1

  const rowCount = current.value.data?.length || 1
  const baseHeight = 220
  const perRowHeight = 60
  const visualHeight = Math.max(baseHeight, rowCount * perRowHeight)

  // 同步 CSS 尺寸，有助于确保 rect 与绘制一致
  canvasRef.value.style.width = `${rect.width}px`
  canvasRef.value.style.height = `${visualHeight}px`

  // 设置画布像素尺寸并缩放
  canvasRef.value.width = Math.round(rect.width * dprRef)
  canvasRef.value.height = Math.round(visualHeight * dprRef)

  ctx = canvasRef.value.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dprRef, dprRef)
  ctx.font =
    '14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
  ctx.textBaseline = 'middle'

  // 下一帧绘制，确保布局稳定
  requestAnimationFrame(() => drawChart())
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
  handleResize()
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