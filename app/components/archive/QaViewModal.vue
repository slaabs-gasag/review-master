<script setup lang="ts">
interface QaEntryWithItem {
  id: string
  review_id: string
  item_id: string
  author: string
  author_role: string
  text: string
  captured_at: number
  item_title: string
  item_issue_id: string
}

const props = defineProps<{
  open: boolean
  reviewId: string | null
  reviewName: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const { data: entries, pending } = useAsyncData<QaEntryWithItem[]>(
  () => `qa-view-${props.reviewId}`,
  async () => {
    if (!props.reviewId) return []
    return $fetch<QaEntryWithItem[]>(`/api/reviews/${props.reviewId}/qa`)
  },
  { watch: [() => props.reviewId] }
)

const grouped = computed(() => {
  if (!entries.value?.length) return []
  const map = new Map<string, { itemId: string; itemTitle: string; itemIssueId: string; entries: QaEntryWithItem[] }>()
  for (const e of entries.value) {
    if (!map.has(e.item_id)) {
      map.set(e.item_id, { itemId: e.item_id, itemTitle: e.item_title, itemIssueId: e.item_issue_id, entries: [] })
    }
    map.get(e.item_id)!.entries.push(e)
  }
  return [...map.values()]
})

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Transition name="qa-modal">
    <div v-if="open" class="qa-modal-backdrop" @click="onBackdrop">
      <div class="qa-modal">
        <div class="qa-modal-head">
          <div class="qa-modal-title">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="color:var(--brand);">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            Q&A
            <span style="color:var(--fg-subtle);font-weight:400;font-size:var(--text-sm);">{{ reviewName }}</span>
          </div>
          <button class="rm-icon-btn" @click="emit('close')">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="qa-modal-body">
          <div v-if="pending" style="padding:32px;text-align:center;color:var(--fg-disabled);font-size:var(--text-sm);">
            Loading…
          </div>
          <div v-else-if="!entries?.length" style="padding:32px;text-align:center;color:var(--fg-disabled);font-size:var(--text-sm);">
            No Q&A recorded for this review.
          </div>
          <template v-else>
            <div v-for="group in grouped" :key="group.itemId" class="qa-modal-group">
              <div class="qa-modal-group-head">
                <span class="qa-modal-issue">{{ group.itemIssueId }}</span>
                <span class="qa-modal-item-title">{{ group.itemTitle || group.itemIssueId }}</span>
                <span class="chip chip-neutral" style="font-size:10px;">{{ group.entries.length }}</span>
              </div>
              <div v-for="entry in group.entries" :key="entry.id" class="qa-item">
                <AvatarGradient :name="entry.author || '?'" size="sm" />
                <div class="qa-body">
                  <div class="qa-author">
                    {{ entry.author || 'Anonymous' }}
                    <span v-if="entry.author_role" style="font-weight:400;color:var(--fg-subtle);"> · {{ entry.author_role }}</span>
                    <span class="qa-time"> · {{ formatTime(entry.captured_at) }}</span>
                  </div>
                  <div class="qa-text">{{ entry.text }}</div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.qa-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.qa-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 540px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--elev-4);
}

.qa-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.qa-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--fg);
}

.qa-modal-body {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

.qa-modal-group {
  padding: 12px 20px;
}

.qa-modal-group + .qa-modal-group {
  border-top: 1px solid var(--border);
}

.qa-modal-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.qa-modal-issue {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--brand-soft);
  letter-spacing: 0.06em;
}

.qa-modal-item-title {
  font-size: var(--text-xs);
  color: var(--fg-muted);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-modal-enter-active,
.qa-modal-leave-active {
  transition: opacity 0.15s ease;
}
.qa-modal-enter-active .qa-modal,
.qa-modal-leave-active .qa-modal {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.qa-modal-enter-from,
.qa-modal-leave-to {
  opacity: 0;
}
.qa-modal-enter-from .qa-modal,
.qa-modal-leave-to .qa-modal {
  transform: translateY(8px);
  opacity: 0;
}
</style>
