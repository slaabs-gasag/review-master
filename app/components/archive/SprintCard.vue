<script setup lang="ts">
import type { ReviewWithItems } from '~/server/types/db'

const props = defineProps<{
  review: ReviewWithItems
  featured?: boolean
}>()

const items = computed(() =>
  Array.isArray(props.review.items) ? props.review.items.filter(Boolean) : []
)

const presenters = computed(() => {
  const seen = new Set<string>()
  return items.value
    .map(i => i.presenter)
    .filter((p): p is string => { if (!p || seen.has(p)) return false; seen.add(p); return true })
    .slice(0, 4)
})

const shipped = computed(() => items.value.filter(i => i.item_status === 'done').length)

const duration = computed(() => {
  if (!props.review.duration_ms) return null
  const m = Math.floor(props.review.duration_ms / 60000)
  return `${m}m`
})

const completedDate = computed(() => {
  return formatGermanDate(props.review.completed_at)
})
</script>

<template>
  <div class="sprint-card" :class="{ featured }">
    <div class="sprint-head">
      <div class="sprint-team">
        <AvatarGradient :name="review.team || review.name" size="md" style="border-radius:var(--radius-md);" />
        <div class="sprint-meta-l">
          <div class="sprint-title">{{ review.name }}</div>
          <div class="sprint-date">{{ completedDate }}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <span v-if="featured" class="chip chip-cyan" style="font-size:10px;">latest</span>
        <span class="chip chip-neutral" style="font-size:10px;">Sprint {{ review.sprint }}</span>
      </div>
    </div>

    <div class="sprint-numbers">
      <div class="sprint-num">
        <span class="l">Items</span>
        <span class="v">{{ items.length }}</span>
      </div>
      <div class="sprint-num">
        <span class="l">Shipped</span>
        <span class="v">{{ shipped }}</span>
      </div>
    </div>

    <div v-if="presenters.length" class="sprint-presenters">
      <div class="avatar-stack">
        <AvatarGradient v-for="p in presenters" :key="p" :name="p" size="sm" />
      </div>
      <span class="sprint-presenters-meta">{{ presenters.length }} presenter{{ presenters.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="sprint-foot">
      <div class="sprint-foot-l">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/>
          <path d="M5 3v2.5l1.5 1.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        <span>{{ duration ?? '—' }}</span>
      </div>
    </div>
  </div>
</template>
