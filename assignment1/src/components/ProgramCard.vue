<template>
    <div class="card h-100 card-hover">
      <div class="card-body">
        <h5 class="card-title">{{ program.title }}</h5>
        <p class="text-muted mb-1">{{ program.level }} · {{ program.location }}</p>
        <p class="mb-2">
          <b>{{ dateText }}</b> · <span class="text-success">{{ priceText }}</span>
        </p>
        <p class="small">{{ program.desc }}</p>
        <button class="btn btn-outline-primary btn-sm" @click="$emit('apply', program)">
          Apply
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { formatDateISOToDMY } from '../utils/format.js'
  
  const props = defineProps({ program: { type: Object, required: true } })
  const priceText = computed(() => (props.program.price > 0 ? `$${props.program.price}` : 'Free'))
  const dateText = computed(() => formatDateISOToDMY(props.program.date))
  </script>
  
  <style scoped>
  .card-hover { transition: transform .15s ease, box-shadow .15s ease; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15); }
  </style>