<script setup lang="ts">
import type { QaEntry } from '~/server/types/db'

const props = defineProps<{
  open: boolean
  entries: QaEntry[]
  isArchive: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: { author: string; author_role: string; text: string }]
  delete: [id: string]
}>()

const text = ref('')
const author = ref('')
const authorRole = ref('')

function submitQA() {
  if (!text.value.trim()) return
  emit('save', { author: author.value, author_role: authorRole.value, text: text.value.trim() })
  text.value = ''
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <Transition name="qa">
    <div v-if="open" class="qa-panel">
      <div class="qa-head">
        <div class="qa-head-l">
          <span style="font-size:var(--text-sm);font-weight:600;color:var(--fg);">Q&A</span>
          <span v-if="entries.length" class="chip chip-neutral">{{ entries.length }}</span>
        </div>
        <button class="rm-icon-btn" @click="emit('close')">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="qa-list">
        <div v-if="!entries.length" style="padding:20px 16px;color:var(--fg-disabled);font-size:var(--text-sm);text-align:center;">
          No questions yet
        </div>
        <div v-for="entry in entries" :key="entry.id" class="qa-item">
          <AvatarGradient :name="entry.author || '?'" size="sm" />
          <div class="qa-body">
            <div class="qa-author">
              {{ entry.author || 'Anonymous' }}
              <span v-if="entry.author_role" style="font-weight:400;color:var(--fg-subtle);"> · {{ entry.author_role }}</span>
              <span class="qa-time"> · {{ formatTime(entry.captured_at) }}</span>
            </div>
            <div class="qa-text">{{ entry.text }}</div>
          </div>
          <button v-if="!isArchive" class="rm-icon-btn" style="flex-shrink:0;" @click="emit('delete', entry.id)">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="!isArchive" class="qa-input-row">
        <input
          v-model="text"
          class="rm-input"
          style="flex:1;"
          placeholder="Question or note..."
          @keydown.enter.prevent="submitQA"
        />
        <button class="rm-btn rm-btn-primary" style="padding:8px 14px;font-size:var(--text-xs);" @click="submitQA">Save</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.qa-enter-active, .qa-leave-active { transition: transform var(--dur-base) var(--ease-instrument), opacity var(--dur-base); }
.qa-enter-from, .qa-leave-to { transform: translateX(20px); opacity: 0; }
</style>
