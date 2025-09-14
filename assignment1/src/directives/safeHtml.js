// src/directives/safeHtml.js
import { sanitizeHTML } from '@/utils/sanitize'

export default {
  mounted(el, binding) {
    el.innerHTML = sanitizeHTML(binding.value ?? '')
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = sanitizeHTML(binding.value ?? '')
    }
  }
}