<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

definePageMeta({ layout: 'default' })

const {
  review,
  plannedReviews: planReviews,
  draftReviews,
  readyReviews,
  activeReviews,
  refresh,
  selectReview,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
  startReview,
  finishPlanning,
} = useCurrentReview()

const selectedItemId = ref<string | null>(null)
const starting = ref(false)
const finishing = ref(false)
const addError = ref('')

const selectedId = computed({
  get() {
    const items = review.value?.items ?? []
    if (!items.length) return null
    return items.some(i => i.id === selectedItemId.value)
      ? selectedItemId.value
      : items[0]?.id ?? null
  },
  set(id: string | null) {
    selectedItemId.value = id
  },
})

const selectedItem = computed<ReviewItemWithMedia | null>(() =>
  review.value?.items?.find(i => i.id === selectedId.value) ?? null
)

const stats = computed(() => {
  const items = review.value?.items ?? []
  return {
    total: items.length,
    done: items.filter(i => i.item_status === 'done').length,
    presenters: new Set(items.map(i => i.presenter).filter(Boolean)).size,
  }
})

const selectedStatusLabel = computed(() => {
  if (review.value?.status === 'planned') return 'Draft'
  if (review.value?.status === 'plan_finished') return 'Ready'
  if (review.value?.status === 'active') return 'Live'
  return ''
})

const canStartReview = computed(() =>
  review.value?.status === 'plan_finished' || review.value?.status === 'active'
)

const primaryActionLabel = computed(() => {
  if (review.value?.status === 'planned') return finishing.value ? 'Finishing…' : 'Finish planning'
  if (review.value?.status === 'active') return starting.value ? 'Opening…' : 'Resume review →'
  return starting.value ? 'Starting…' : 'Start review →'
})

function getNextIssueId() {
  const items = review.value?.items ?? []
  const used = new Set(items.map(item => item.issue_id))
  const highestNewId = items.reduce((highest, item) => {
    const match = /^NEW-(\d+)$/.exec(item.issue_id)
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)

  let next = highestNewId + 1
  let issueId = `NEW-${String(next).padStart(3, '0')}`
  while (used.has(issueId)) {
    next += 1
    issueId = `NEW-${String(next).padStart(3, '0')}`
  }

  return issueId
}

async function handleAddItem() {
  if (!review.value) return
  addError.value = ''
  try {
    const item = await addItem({ issue_id: getNextIssueId(), title: '', presenter: '', item_status: 'progress', tags: [] })
    if (item) selectedId.value = item.id
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
  if (!review.value || !review.value.items.length || !canStartReview.value) return
  starting.value = true
  try {
    await startReview()
  } finally {
    starting.value = false
  }
}

async function handleFinishPlanning() {
  if (!review.value || review.value.status !== 'planned') return
  finishing.value = true
  try {
    await finishPlanning()
  } finally {
    finishing.value = false
  }
}

async function handlePrimaryAction() {
  if (review.value?.status === 'planned') {
    await handleFinishPlanning()
    return
  }
  await handleStartReview()
}

async function handleReorder(ids: string[]) {
  await reorderItems(ids)
}

async function handleSelectReview(id: string) {
  selectedItemId.value = null
  await selectReview(id)
}

function reviewTitle(r: { name: string; sprint: string; team?: string }) {
  return `${r.name} · Sprint ${r.sprint}${r.team ? ` · ${r.team}` : ''}`
}
</script>

<template>
  <div v-if="!review" class="empty-state">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="color:var(--fg-disabled)">
      <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" stroke-width="1.5"/>
      <rect x="16" y="6" width="16" height="8" rx="2" fill="var(--bg-surface)" stroke="currentColor" stroke-width="1.5"/>
      <path d="M16 26h16M16 32h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <h3>No planned reviews</h3>
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
            <span class="chip chip-neutral">{{ selectedStatusLabel }}</span>
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

      <div v-if="planReviews.length" class="review-switcher">
        <div v-if="draftReviews.length" class="review-switcher-group">
          <span class="eyebrow">Drafts</span>
          <button
            v-for="draft in draftReviews"
            :key="draft.id"
            class="review-switcher-item"
            :class="{ on: draft.id === review.id }"
            @click="handleSelectReview(draft.id)"
          >
            {{ reviewTitle(draft) }}
          </button>
        </div>
        <div v-if="readyReviews.length" class="review-switcher-group">
          <span class="eyebrow">Ready</span>
          <button
            v-for="ready in readyReviews"
            :key="ready.id"
            class="review-switcher-item"
            :class="{ on: ready.id === review.id }"
            @click="handleSelectReview(ready.id)"
          >
            {{ reviewTitle(ready) }}
          </button>
        </div>
        <div v-if="activeReviews.length" class="review-switcher-group">
          <span class="eyebrow">Running</span>
          <button
            v-for="active in activeReviews"
            :key="active.id"
            class="review-switcher-item"
            :class="{ on: active.id === review.id }"
            @click="handleSelectReview(active.id)"
          >
            {{ reviewTitle(active) }}
          </button>
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
          :disabled="review.status === 'planned' ? finishing : (!(review.items?.length ?? 0) || starting)"
          @click="handlePrimaryAction"
        >
          {{ primaryActionLabel }}
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

<style scoped>
.review-switcher {
  display: grid;
  gap: 12px;
  padding: 0 22px 18px;
}

.review-switcher-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.review-switcher-item {
  min-height: 34px;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--fg-muted);
  cursor: pointer;
  font-size: var(--text-xs);
  line-height: 1.2;
  padding: 8px 10px;
}

.review-switcher-item:hover,
.review-switcher-item.on {
  border-color: var(--brand);
  color: var(--fg);
}
</style>
