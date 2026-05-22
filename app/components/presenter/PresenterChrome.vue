<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

const props = defineProps<{
  item: ReviewItemWithMedia
  index: number
  total: number
  elapsed: number
  isArchive: boolean
  qaCount: number
}>()

const emit = defineEmits<{
  prev: []
  next: []
  exit: []
  toggleQA: []
}>()

const isFirst = computed(() => props.index === 0)
const isLast = computed(() => props.index === props.total - 1)

const elapsedStr = computed(() => {
  const s = Math.floor(props.elapsed / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
})
</script>

<template>
  <div class="present-chrome">
    <!-- TL: live dot + issue + title -->
    <div class="chrome-tl">
      <span v-if="!isArchive" class="livedot" />
      <span v-else class="chip chip-neutral" style="font-size:10px;padding:2px 8px;">archive</span>
      <span class="issue">{{ item.issue_id }}</span>
      <span class="title">{{ item.title || item.issue_id }}</span>
    </div>

    <!-- TR: pips + counter + close -->
    <div class="chrome-tr">
      <div class="pips">
        <div
          v-for="(_, i) in total"
          :key="i"
          class="pip"
          :class="{ done: i < index, now: i === index }"
        />
      </div>
      <span class="count">{{ index + 1 }}<span>/{{ total }}</span></span>
      <button class="rm-icon-btn" @click="emit('exit')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- BL: avatar + presenter name -->
    <div class="chrome-bl">
      <AvatarGradient :name="item.presenter || '?'" size="md" />
      <div>
        <div class="presenter-name">{{ item.presenter || 'Unknown' }}</div>
        <div v-if="item.demo_url" class="presenter-role">
          <a :href="item.demo_url" target="_blank" rel="noopener" style="color:var(--brand-soft);">Open demo ↗</a>
        </div>
      </div>
    </div>

    <!-- BR: Q&A btn + nav + timer -->
    <div class="chrome-br">
      <button class="rm-btn rm-btn-soft" style="font-size:var(--text-xs);" @click="emit('toggleQA')">
        Q&A <span v-if="qaCount > 0" class="chip chip-cyan" style="font-size:10px;padding:1px 7px;margin-left:4px;">{{ qaCount }}</span>
      </button>

      <div class="chrome-nav">
        <button class="chrome-nav-btn" :disabled="isFirst" @click="emit('prev')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L4 7l5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="chrome-nav-time">{{ elapsedStr }}</span>
        <button class="chrome-nav-btn primary" @click="emit('next')">
          <svg v-if="!isLast" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l5 4-5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
