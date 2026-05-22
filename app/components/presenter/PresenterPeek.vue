<script setup lang="ts">
import type { PresentationSlide } from '~/utils/presenterSlides'

const props = defineProps<{
  slides: PresentationSlide[]
  currentIndex: number
  visible: boolean
}>()

const emit = defineEmits<{ select: [index: number] }>()
</script>

<template>
  <Transition name="peek">
    <div v-if="visible" class="present-peek">
      <button
        v-for="(slide, i) in slides"
        :key="slide.id"
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
          {{ slide.kind === 'cover' ? 'Cover' : slide.kind === 'agenda' ? 'Agenda' : slide.kind === 'end' ? 'Review' : slide.item?.issue_id }}
        </span>
        <span
          v-if="slide.kind === 'cover'"
          style="font-family:var(--font-mono);font-size:10px;color:var(--fg-disabled);"
        >
          Start
        </span>
        <span
          v-else-if="slide.kind === 'agenda'"
          style="font-family:var(--font-mono);font-size:10px;color:var(--fg-disabled);"
        >
          Liste
        </span>
        <span
          v-else-if="slide.kind === 'end'"
          style="font-family:var(--font-mono);font-size:10px;color:var(--fg-disabled);"
        >
          Ende
        </span>
        <span
          v-else-if="slide.kind === 'intro'"
          style="font-family:var(--font-mono);font-size:10px;color:var(--fg-disabled);"
        >
          Intro
        </span>
        <span
          v-else-if="slide.screenshotCount > 1"
          style="font-family:var(--font-mono);font-size:10px;color:var(--fg-disabled);"
        >
          {{ (slide.screenshotIndex ?? 0) + 1 }}/{{ slide.screenshotCount }}
        </span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.peek-enter-active, .peek-leave-active { transition: transform var(--dur-base) var(--ease-instrument); }
.peek-enter-from, .peek-leave-to { transform: translateX(100%); }
</style>
