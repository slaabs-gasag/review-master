<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

const props = defineProps<{
  item: ReviewItemWithMedia
  index: number
  selected: boolean
  dragging: boolean
}>()

const emit = defineEmits<{
  select: []
  dragstart: [id: string]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
}>()

const idxLabel = computed(() => String(props.index + 1).padStart(2, '0'))
</script>

<template>
  <div
    class="agenda-item"
    :class="{ on: selected, dragging: dragging }"
    draggable="true"
    @click="emit('select')"
    @dragstart="emit('dragstart', item.id)"
    @dragover.prevent="emit('dragover', $event)"
    @drop.prevent="emit('drop', $event)"
  >
    <div class="agenda-grip">
      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
        <circle cx="4" cy="4" r="1.5"/><circle cx="8" cy="4" r="1.5"/>
        <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
        <circle cx="4" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
      </svg>
    </div>

    <div class="agenda-idx-id">
      <span class="agenda-idx">{{ idxLabel }}</span>
      <span class="agenda-id">{{ item.issue_id }}</span>
    </div>

    <div class="agenda-main">
      <div class="agenda-title">{{ item.title || item.issue_id }}</div>
      <div class="agenda-meta-row">
        <span v-if="item.screenshots.length" class="meta-tag">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="1" y="2" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1"/>
            <circle cx="3.5" cy="4.5" r="0.75" fill="currentColor"/>
            <path d="M1 7l2.5-2 2 1.5L8 4l1 2" stroke="currentColor" stroke-width="0.8"/>
          </svg>
          {{ item.screenshots.length }}
        </span>
        <span v-if="item.demo_url" class="meta-tag">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M4 2H2a1 1 0 00-1 1v5a1 1 0 001 1h6a1 1 0 001-1V7" stroke="currentColor" stroke-width="1"/>
            <path d="M6 1h3m0 0v3m0-3L5 5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
          </svg>
          demo
        </span>
        <span v-if="item.tags.length" class="meta-tag">
          {{ item.tags.slice(0, 2).join(', ') }}
          <span v-if="item.tags.length > 2">+{{ item.tags.length - 2 }}</span>
        </span>
      </div>
    </div>

    <div class="agenda-presenter">
      <AvatarGradient :name="item.presenter || '?'" size="sm" />
      <span style="font-size: var(--text-xs); color: var(--fg-muted); max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        {{ item.presenter || '—' }}
      </span>
    </div>

    <div class="agenda-status">
      <StatusBadge :status="item.item_status === 'progress' ? 'progress' : item.item_status" />
    </div>
  </div>
</template>
