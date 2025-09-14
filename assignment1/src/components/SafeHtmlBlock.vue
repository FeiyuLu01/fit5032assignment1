<!-- src/components/SafeHtmlBlock.vue -->
<template>
    <div v-safe-html="html"></div>
  </template>
  
  <script setup>
  import safeHtml from '@/directives/safeHtml'
  defineProps({ html: { type: String, default: '' } })
  defineOptions({ directives: { safeHtml } })
  </script>