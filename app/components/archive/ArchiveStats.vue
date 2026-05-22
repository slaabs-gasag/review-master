<script setup lang="ts">
import type { ReviewWithItems } from '~/server/types/db'

const props = defineProps<{ reviews: ReviewWithItems[] }>()

const stats = computed(() => {
  const total = props.reviews.length
  const items = props.reviews.flatMap(r => Array.isArray(r.items) ? r.items.filter(Boolean) : [])
  const shipped = items.filter(i => i.item_status === 'done').length
  const presenters = new Set(items.map(i => i.presenter).filter(Boolean)).size

  const qaCount = props.reviews.reduce((acc, r) => {
    return acc
  }, 0)

  return { total, shipped, presenters, totalItems: items.length }
})
</script>

<template>
  <div class="archive-stats">
    <div class="stat-card">
      <span class="stat-l">Sprints Archived</span>
      <span class="stat-v">{{ stats.total }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-l">Items Shipped</span>
      <span class="stat-v">{{ stats.shipped }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-l">Unique Presenters</span>
      <span class="stat-v">{{ stats.presenters }}</span>
    </div>
    <div class="stat-card">
      <span class="stat-l">Total Items</span>
      <span class="stat-v">{{ stats.totalItems }}</span>
    </div>
  </div>
</template>
