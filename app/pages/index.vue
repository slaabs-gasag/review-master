<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

definePageMeta({ layout: 'default' })

const { review, refresh, addItem, updateItem, deleteItem, reorderItems, startReview } = useCurrentReview()

const selectedId = ref<string | null>(null)
const starting = ref(false)
const addError = ref('')

const selectedItem = computed<ReviewItemWithMedia | null>(() =>
  review.value?.items?.find(i => i.id === selectedId.value) ?? null
)

watch(review, (r) => {
  const items = r?.items ?? []
  if (items.length > 0 && !selectedId.value) {
    selectedId.value = items[0]?.id ?? null
  }
  if (items.length === 0) {
    selectedId.value = null
  }
}, { immediate: true })

const stats = computed(() => {
  const items = review.value?.items ?? []
  return {
    total: items.length,
    done: items.filter(i => i.item_status === 'done').length,
    presenters: new Set(items.map(i => i.presenter).filter(Boolean)).size,
  }
})

async function handleAddItem() {
  if (!review.value) return
  addError.value = ''
  try {
    await addItem({ issue_id: 'NEW-001', title: '', presenter: '', item_status: 'progress', tags: [] })
    const items = review.value?.items
    if (items?.length) selectedId.value = items[items.length - 1]?.id ?? null
  } catch (e: any) {
    addError.value = e?.data?.message ?? 'Failed to add item'
  }
}

async function handleUpdate(payload: Partial<ReviewItemWithMedia>) {
  if (!selectedId.value) return
  await updateItem(selectedId.value, payload)
}

async function handleUploadScreenshot(file: File) {
  if (!selectedId.value) return
  const form = new FormData()
  form.append('file', file)
  await $fetch(`/api/items/${selectedId.value}/screenshots`, { method: 'POST', body: form })
  await refresh()
}

async function handleDeleteScreenshot(id: string) {
  await $fetch(`/api/screenshots/${id}`, { method: 'DELETE' })
  await refresh()
}

async function handleStartReview() {
  if (!review.value || !review.value.items.length) return
  starting.value = true
  try {
    await startReview()
  } finally {
    starting.value = false
  }
}

async function handleReorder(ids: string[]) {
  await reorderItems(ids)
}
</script>

<template>
  <div v-if="!review" class="empty-state">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="color:var(--fg-disabled)">
      <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" stroke-width="1.5"/>
      <rect x="16" y="6" width="16" height="8" rx="2" fill="var(--bg-surface)" stroke="currentColor" stroke-width="1.5"/>
      <path d="M16 26h16M16 32h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <h3>No active review</h3>
    <p>Create your first sprint review to get started.</p>
    <NuxtLink to="/reviews/new" class="rm-btn rm-btn-primary">Create review</NuxtLink>
  </div>

  <div v-else class="plan">
    <!-- Left column: agenda list -->
    <div class="plan-list">
      <div class="plan-list-head">
        <div class="plan-head-meta">
          <div class="plan-head-title">{{ review.name }}</div>
          <div class="plan-head-sub">
            <span class="chip chip-neutral">Sprint {{ review.sprint }}</span>
            <span v-if="review.team" style="color:var(--fg-subtle)">{{ review.team }}</span>
            <span style="color:var(--fg-subtle)">{{ formatGermanDate(review.created_at) }}</span>
          </div>
        </div>
        <div class="plan-head-actions">
          <NuxtLink to="/reviews/new" class="rm-btn rm-btn-ghost" style="font-size:var(--text-xs);">
            + New review
          </NuxtLink>
        </div>
      </div>

      <div class="plan-list-eyebrow">
        <span class="eyebrow">Agenda</span>
        <span class="eyebrow" style="color:var(--fg-disabled)">{{ stats.total }} items</span>
      </div>

      <AgendaList
        :items="review.items ?? []"
        :selected-id="selectedId"
        @select="(id: string) => selectedId = id"
        @reorder="handleReorder"
        @add="handleAddItem"
      />

      <p v-if="addError" style="padding:8px 22px;color:var(--coral-50);font-size:var(--text-xs);">{{ addError }}</p>

      <div class="plan-cta-bar">
        <div class="plan-cta-summary">
          <div class="stat">
            <span class="stat-l">Items</span>
            <span class="stat-v">{{ stats.total }}</span>
          </div>
          <div class="stat">
            <span class="stat-l">Done</span>
            <span class="stat-v">{{ stats.done }}</span>
          </div>
          <div class="stat">
            <span class="stat-l">Presenters</span>
            <span class="stat-v">{{ stats.presenters }}</span>
          </div>
        </div>
        <button
          class="rm-btn rm-btn-primary"
          :disabled="!(review.items?.length ?? 0) || starting"
          @click="handleStartReview"
        >
          {{ starting ? 'Starting…' : 'Start review →' }}
        </button>
      </div>
    </div>

    <!-- Right column: item editor -->
    <div v-if="selectedItem">
      <ItemEditor
        :item="selectedItem"
        @update="handleUpdate"
        @upload-screenshot="handleUploadScreenshot"
        @delete-screenshot="handleDeleteScreenshot"
      />
    </div>
    <div v-else class="plan-detail" style="display:flex;align-items:center;justify-content:center;">
      <p style="color:var(--fg-disabled);font-size:var(--text-sm);">Select an item to edit</p>
    </div>
  </div>
</template>
