<template>
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
          <h5 class="m-0">{{ title }}</h5>
        </div>
  
        <div class="table-responsive">
          <table class="table align-middle">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Hoops</th>
                <th>Lighting</th>
                <th>Updated</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in items" :key="c.id">
                <td>{{ c.name }}</td>
                <td>{{ c.address }}</td>
                <td>{{ c.hoops ?? '-' }}</td>
                <td>{{ c.lighting ? 'Yes' : 'No' }}</td>
                <td>
                  {{
                    (c.updatedAt?.toDate?.() || c.updatedAt)
                      ? new Date(c.updatedAt.toDate?.() ?? c.updatedAt).toLocaleString()
                      : '—'
                  }}
                </td>
                <td class="text-end">
                  <div class="btn-group">
                    <button class="btn btn-outline-secondary btn-sm" @click="openEdit(c)">
                      Edit
                    </button>
                    <button class="btn btn-outline-danger btn-sm" @click="$emit('delete', c.id)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
  
              <tr v-if="!items.length">
                <td colspan="6" class="text-center text-muted py-4">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div class="d-flex justify-content-center">
          <button class="btn btn-outline-secondary" :disabled="!cursor" @click="loadMore">
            Load more
          </button>
        </div>
      </div>
  
      <!-- Edit Modal -->
      <div class="modal fade" tabindex="-1" ref="editModalEl">
        <div class="modal-dialog">
          <div class="modal-content">
            <form @submit.prevent="submitEdit">
              <div class="modal-header">
                <h5 class="modal-title">Edit Court</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"/>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input v-model="editForm.name" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <input v-model="editForm.address" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Hoops</label>
                  <input v-model.number="editForm.hoops" type="number" min="0" class="form-control" />
                </div>
                <div class="form-check">
                  <input v-model="editForm.lighting" class="form-check-input" type="checkbox" id="lightingCheck">
                  <label for="lightingCheck" class="form-check-label">Lighting</label>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
  
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, nextTick, defineExpose } from 'vue'
  import { Modal } from 'bootstrap'
  import { listApprovedCourts } from '@/services/admin'
  
  const props = defineProps({
    title: String
  })
  const emit = defineEmits(['update','delete'])
  
  const items = ref([])
  const cursor = ref(null)
  
  const editModalEl = ref(null)
  let editModalInstance = null
  
  const editing = ref(null)
  const editForm = ref({ name:'', address:'', hoops:0, lighting:false })
  
  onMounted(async () => {
    await reload()
    await nextTick()
    if (editModalEl.value) {
      editModalInstance = Modal.getOrCreateInstance(editModalEl.value)
    }
  })
  
  async function reload() {
    const { items: rows, cursor: cur } = await listApprovedCourts({})
    items.value = rows
    cursor.value = cur
  }
  
  async function loadMore() {
    const { items: rows, cursor: cur } = await listApprovedCourts({ last: cursor.value })
    items.value.push(...rows)
    cursor.value = cur
  }
  
  function openEdit(c) {
    editing.value = c
    editForm.value = {
      name: c.name,
      address: c.address,
      hoops: c.hoops || 0,
      lighting: !!c.lighting
    }
    editModalInstance?.show()
  }
  
  async function submitEdit() {
    await emit('update', { id: editing.value.id, patch: editForm.value })
    editModalInstance?.hide()
    await reload()
  }
  
  // 暴露给父组件刷新
  defineExpose({ reload })
  </script>