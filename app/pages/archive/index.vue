<script setup lang="ts">
import type { Review, ReviewItemWithMedia, ReviewWithItems } from '~/server/types/db'

definePageMeta({ layout: 'default' })

function normalizeItem(item: Partial<ReviewItemWithMedia>): ReviewItemWithMedia {
  return {
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    screenshots: Array.isArray(item.screenshots) ? item.screenshots : [],
  } as ReviewItemWithMedia
}

function normalizeReview(review: ReviewWithItems): ReviewWithItems {
  return {
    ...review,
    items: Array.isArray(review.items) ? review.items.map(normalizeItem) : [],
  }
}

const { data: completed } = await useAsyncData<ReviewWithItems[]>(
  'completed-reviews',
  async () => {
    const reviews = await $fetch<Review[]>('/api/reviews')
    const completedReviews = reviews
      .filter(r => r.status === 'completed')
      .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0))

    return Promise.all(
      completedReviews.map(async (review) => {
        const detail = await $fetch<ReviewWithItems>(`/api/reviews/${review.id}`)
        return normalizeReview(detail)
      }),
    )
  },
  {
    default: () => [],
  },
)

const sortedCompleted = computed(() =>
  completed.value
    .filter(r => r.status === 'completed')
    .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0))
)

const activeFilter = ref<string | null>(null)

const teams = computed(() => {
  const t = new Set(sortedCompleted.value.map(r => r.team).filter(Boolean))
  return [...t]
})

const filtered = computed(() =>
  activeFilter.value
    ? sortedCompleted.value.filter(r => r.team === activeFilter.value)
    : sortedCompleted.value
)

// Q&A modal
const qaTarget = ref<ReviewWithItems | null>(null)
const qaOpen = ref(false)

function openQaModal(review: ReviewWithItems) {
  qaTarget.value = review
  qaOpen.value = true
}

// Delete
const deleteTarget = ref<ReviewWithItems | null>(null)
const deleteOpen = ref(false)
const deleteError = ref<string | null>(null)
const deleteLoading = ref(false)

function openDeleteModal(review: ReviewWithItems) {
  deleteTarget.value = review
  deleteError.value = null
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  deleteError.value = null
  try {
    await $fetch(`/api/reviews/${deleteTarget.value.id}`, { method: 'DELETE' })
    completed.value = (completed.value ?? []).filter(r => r.id !== deleteTarget.value!.id)
    deleteOpen.value = false
  }
  catch {
    deleteError.value = 'Deletion failed. Please try again.'
  }
  finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="archive">
    <div class="archive-head">
      <h1>Archive</h1>
      <p>All completed sprint reviews.</p>
    </div>

    <div v-if="!sortedCompleted.length" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="color:var(--fg-disabled)">
        <rect x="8" y="12" width="32" height="28" rx="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M16 24h16M16 30h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <h3>No completed reviews</h3>
      <p>Complete a sprint review to see it here.</p>
      <NuxtLink to="/" class="rm-btn rm-btn-primary">Go to planning</NuxtLink>
    </div>

    <template v-else>
      <ArchiveStats :reviews="sortedCompleted" />

      <div v-if="teams.length > 1" class="archive-filters" style="margin-bottom:20px;">
        <button
          class="filter-pill"
          :class="{ on: activeFilter === null }"
          @click="activeFilter = null"
        >All teams</button>
        <button
          v-for="team in teams"
          :key="team"
          class="filter-pill"
          :class="{ on: activeFilter === team }"
          @click="activeFilter = activeFilter === team ? null : team"
        >{{ team }}</button>
      </div>

      <div class="archive-grid">
        <div
          v-for="(review, i) in filtered"
          :key="review.id"
          class="archive-card-wrap"
        >
          <NuxtLink :to="`/archive/${review.id}`" style="text-decoration:none;display:block;">
            <SprintCard :review="review" :featured="i === 0 && activeFilter === null" />
          </NuxtLink>
          <div class="archive-card-actions">
            <button class="archive-qa-btn" title="View Q&A" @click="openQaModal(review)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M5.5 5.5c0-1 .67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .67-.5 1.17-1 1.33V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <circle cx="7" cy="9.5" r=".6" fill="currentColor"/>
              </svg>
              Q&A
            </button>
            <button class="archive-delete-btn" title="Delete review" @click="openDeleteModal(review)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M5.5 3.5V2.5h3v1M6 6v4M8 6v4M3 3.5l.7 7.5h6.6l.7-7.5H3z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Delete
            </button>
            <NuxtLink :to="`/archive/${review.id}`" class="archive-rewatch-btn">Re-watch →</NuxtLink>
          </div>
        </div>
      </div>

      <QaViewModal
        :open="qaOpen"
        :review-id="qaTarget?.id ?? null"
        :review-name="qaTarget?.name ?? null"
        @close="qaOpen = false"
      />

      <DeleteReviewModal
        v-model:open="deleteOpen"
        :review-name="deleteTarget?.name"
        :loading="deleteLoading"
        :error="deleteError"
        @confirm="confirmDelete"
      />
    </template>
  </div>
</template>
