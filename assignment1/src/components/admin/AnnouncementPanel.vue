<!-- src/components/AnnouncementPanel.vue -->
<template>
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Announcements</h5>
          <span v-if="role" class="badge bg-secondary text-uppercase">{{ role }}</span>
        </div>
  
        <!-- Only admin can see the publish form -->
        <form class="mt-3" @submit.prevent="submit" v-if="isAdmin">
          <div class="mb-2">
            <label class="form-label">Title</label>
            <input
              v-model.trim="title"
              type="text"
              class="form-control"
              maxlength="120"
              required
              placeholder="Up to 120 characters"
            />
          </div>
  
          <div class="mb-2">
            <label class="form-label">Content (HTML allowed, will be sanitized)</label>
            <textarea
              v-model="bodyHtml"
              class="form-control"
              rows="5"
              required
              placeholder="Input announcement content"
            ></textarea>
            <div class="form-text">
              We will sanitize the HTML to prevent XSS.
            </div>
          </div>
  
          <div class="d-flex gap-2">
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Publish
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="reset"
              :disabled="loading"
            >
              Clear
            </button>
          </div>
  
          <div v-if="err" class="alert alert-danger mt-2 mb-0">{{ err }}</div>
          <hr class="mt-3" />
        </form>
  
        <!-- Announcement list -->
        <div v-if="announcements.length === 0" class="text-muted">
          No announcement yet.
        </div>
        <div v-for="a in announcements" :key="a.id" class="mb-3">
          <h6 class="mb-1">{{ a.title }}</h6>
          <small class="text-muted">
            {{ a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : '' }}
            <span v-if="a.author"> · by {{ a.author }}</span>
          </small>
  
          <div class="mt-2">
            <SafeHtmlBlock :html="a.bodyHtml" />
          </div>
  
          <div class="mt-2" v-if="isAdmin">
            <button class="btn btn-sm btn-outline-danger" @click="del(a.id)">
              Delete
            </button>
          </div>
  
          <hr />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
  import { useAuthState } from '@/state/authState'
  import {
    createAnnouncement,
    listenAnnouncements,
    removeAnnouncement
  } from '@/services/announcements'
  import SafeHtmlBlock from '@/components/SafeHtmlBlock.vue'
  
  const { state: auth } = useAuthState()
  const role = computed(() => auth.role)
  const isAdmin = computed(() => role.value === 'admin')
  
  const title = ref('')
  const bodyHtml = ref('')
  const loading = ref(false)
  const err = ref('')
  
  const announcements = ref([])
  let unlisten
  
  onMounted(() => {
    unlisten = listenAnnouncements((list) => {
      announcements.value = list
    })
  })
  
  onBeforeUnmount(() => {
    if (typeof unlisten === 'function') unlisten()
  })
  
  function reset() {
    title.value = ''
    bodyHtml.value = ''
    err.value = ''
  }
  
  async function submit() {
    err.value = ''
    if (!isAdmin.value) {
      err.value = 'Only admin can publish.'
      return
    }
    if (!title.value || title.value.trim().length === 0) {
      err.value = 'Title is required.'
      return
    }
    if (title.value.length > 120) {
      err.value = 'Title must be ≤ 120 characters.'
      return
    }
    if (!bodyHtml.value || bodyHtml.value.trim().length === 0) {
      err.value = 'Content is required.'
      return
    }
  
    loading.value = true
    try {
      await createAnnouncement({
        title: title.value,
        bodyHtml: bodyHtml.value,
        author: auth.user?.email || 'admin'
      })
      reset()
    } catch (e) {
      err.value = e?.message || 'Publish failed.'
      console.error(e)
    } finally {
      loading.value = false
    }
  }
  
  async function del(id) {
    err.value = ''
    if (!isAdmin.value) return
    try {
      await removeAnnouncement(id)
    } catch (e) {
      err.value = e?.message || 'Delete failed.'
    }
  }
  </script>
  
  <style scoped>
  .card {
    border-radius: 12px;
  }
  </style>