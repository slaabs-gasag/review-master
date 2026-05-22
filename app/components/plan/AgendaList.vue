<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

const props = defineProps<{
  items: ReviewItemWithMedia[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
  reorder: [ids: string[]]
  add: []
}>()

const itemsRef = computed(() => props.items)

const { onDragStart, onDragOver, onDrop, onDragEnd, draggingId } = useDragReorder(
  itemsRef as Ref<any[]>,
  (ids) => emit('reorder', ids),
)
</script>

<template>
  <div class="plan-list-body">
    <AgendaRow
      v-for="(item, idx) in items"
      :key="item.id"
      :item="item"
      :index="idx"
      :selected="item.id === selectedId"
      :dragging="item.id === draggingId"
      @select="emit('select', item.id)"
      @dragstart="onDragStart"
      @dragover="(e: DragEvent) => onDragOver(e, idx)"
      @drop="(e: DragEvent) => onDrop(e, idx)"
      @dragend="onDragEnd"
    />

    <button class="agenda-add" @click="emit('add')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Add item
    </button>
  </div>
</template>
