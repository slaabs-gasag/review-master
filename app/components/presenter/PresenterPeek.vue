<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

const props = defineProps<{
  agenda: ReviewItemWithMedia[]
  currentIndex: number
  visible: boolean
}>()

const emit = defineEmits<{ select: [index: number] }>()
</script>

<template>
  <Transition name="peek">
    <div v-if="visible" class="present-peek">
      <button
        v-for="(item, i) in agenda"
        :key="item.id"
        class="present-peek-item"
        :class="{ now: i === currentIndex, done: i < currentIndex }"
        @click="emit('select', i)"
      >
        <span class="pidx">{{ String(i + 1).padStart(2, '0') }}</span>
        <span v-if="i === currentIndex" class="livedot" style="width:6px;height:6px;" />
        <svg v-else-if="i < currentIndex" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.5l2.5 2.5 3.5-5" stroke="var(--mint-50)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          {{ item.issue_id }}
        </span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.peek-enter-active, .peek-leave-active { transition: transform var(--dur-base) var(--ease-instrument); }
.peek-enter-from, .peek-leave-to { transform: translateX(100%); }
</style>
