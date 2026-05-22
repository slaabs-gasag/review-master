<script setup lang="ts">
import type { Review } from '~/server/types/db'

const router = useRouter()
const route = useRoute()

const { data: reviews, refresh: refreshReviews } = await useFetch<Review[]>('/api/reviews', {
  default: () => [],
})

const isPlanActive = computed(() => !route.path.startsWith('/archive'))
const isArchiveActive = computed(() => route.path.startsWith('/archive'))
const plannedCount = computed(() => reviews.value.filter(r =>
  r.status === 'planned' || r.status === 'plan_finished' || r.status === 'active'
).length)
const archivedCount = computed(() => reviews.value.filter(r => r.status === 'completed').length)

watch(() => route.fullPath, () => {
  refreshReviews()
})

defineShortcuts({
  '1': () => router.push('/'),
  '3': () => router.push('/archive')
})
</script>

<template>
  <div class="rm-app">
    <nav class="rm-nav">
      <div class="rm-brand">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="20" height="18" rx="3" stroke="var(--brand)" stroke-width="1.5"/>
          <rect x="9" y="2" width="10" height="5" rx="1.5" fill="var(--bg-surface)" stroke="var(--brand)" stroke-width="1.5"/>
          <path d="M9 14h10M9 18h7" stroke="var(--brand-soft)" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="21" cy="21" r="5" fill="var(--ink-10)" stroke="var(--brand)" stroke-width="1.5"/>
          <path d="M19 21l1.5 1.5L23 19" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="rm-brand-wordmark">Review <span>Master</span></span>
      </div>

      <div class="rm-modes">
        <button class="rm-mode" :class="{ on: isPlanActive }" @click="router.push('/')">
          <span class="rm-mode-dot" />
          Plan
          <span class="rm-mode-count">{{ plannedCount }}</span>
        </button>
        <button class="rm-mode" :class="{ on: isArchiveActive }" @click="router.push('/archive')">
          <span class="rm-mode-dot" />
          Archive
          <span class="rm-mode-count">{{ archivedCount }}</span>
        </button>
      </div>

      <div class="rm-nav-right">
        <slot name="nav-right" />
      </div>
    </nav>

    <main>
      <slot />
    </main>
  </div>
</template>
