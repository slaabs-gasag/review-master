<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

const props = defineProps<{
  item: ReviewItemWithMedia
  screenshotIndex?: number
}>()

const idx = computed(() => props.screenshotIndex ?? 0)
const shot = computed(() => props.item.screenshots[idx.value] ?? null)
</script>

<template>
  <div class="present-stage">
    <div class="present-media">
      <template v-if="shot">
        <img
          :src="`/api/screenshots/${shot.id}`"
          class="present-media-inner"
          style="object-fit: contain;"
          :alt="shot.original_name"
        />
      </template>
      <template v-else>
        <div style="display:flex;flex-direction:column;align-items:center;gap:20px;opacity:0.25;">
          <span style="font-family:var(--font-mono);font-size:clamp(32px,6vw,80px);letter-spacing:0.06em;color:var(--brand-soft);">{{ item.issue_id }}</span>
          <span style="font-family:var(--font-display);font-weight:600;font-size:clamp(16px,2.5vw,28px);color:var(--fg);">{{ item.title }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
