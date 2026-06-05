<script setup lang="ts">
import type { ReviewItemWithMedia, Screenshot } from '~/server/types/db'

const props = defineProps<{ item: ReviewItemWithMedia }>()
const emit = defineEmits<{
  update: [payload: Partial<ReviewItemWithMedia>]
  uploadScreenshot: [file: File]
  deleteScreenshot: [id: string]
  updateScreenshot: [id: string, notes: string | null]
  reorderScreenshots: [ids: string[]]
  deleteItem: []
}>()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const confirmingDelete = ref(false)

const screenshotNotes = ref<Record<string, string>>({})

function initNotes(screenshots: Screenshot[]) {
  for (const s of screenshots) {
    if (!(s.id in screenshotNotes.value)) {
      screenshotNotes.value[s.id] = s.notes ?? ''
    }
  }
}

watch(() => props.item.screenshots, (shots) => {
  initNotes(shots)
}, { immediate: true })

function saveNotes(id: string) {
  const value = screenshotNotes.value[id] ?? ''
  emit('updateScreenshot', id, value || null)
}

const screenshotsRef = computed(() => props.item.screenshots)
const { onDragStart: onShotDragStart, onDragOver: onShotDragOver, onDrop: onShotDrop, onDragEnd: onShotDragEnd, draggingId: draggingShotId } = useDragReorder(
  screenshotsRef as unknown as Ref<any[]>,
  (ids) => emit('reorderScreenshots', ids),
)

const issueId = ref(props.item.issue_id)
const title = ref(props.item.title)
const presenter = ref(props.item.presenter)
const description = ref(props.item.description)
const demoUrl = ref(props.item.demo_url)
const itemStatus = ref(props.item.item_status)
const newTag = ref('')
const showTagInput = ref(false)
const tagInput = useTemplateRef<HTMLInputElement>('tagInput')

watch(() => props.item, (item) => {
  issueId.value = item.issue_id
  title.value = item.title
  presenter.value = item.presenter
  description.value = item.description
  demoUrl.value = item.demo_url
  itemStatus.value = item.item_status
})

function save(field: string, value: unknown) {
  emit('update', { [field]: value })
}

function saveIssueId() {
  const nextIssueId = issueId.value.trim()
  if (!nextIssueId) {
    issueId.value = props.item.issue_id
    return
  }
  save('issue_id', nextIssueId)
}

function saveStatus(s: 'done' | 'progress' | 'blocked') {
  itemStatus.value = s
  save('item_status', s)
}

function removeTag(tag: string) {
  const tags = props.item.tags.filter((t: string) => t !== tag)
  save('tags', tags)
}

async function addTag() {
  const t = newTag.value.trim()
  if (!t) return
  const tags = [...props.item.tags, t]
  save('tags', tags)
  newTag.value = ''
  showTagInput.value = false
}

function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('uploadScreenshot', file)
}

async function onPaste(event: ClipboardEvent) {
  const item = event.clipboardData?.items[0]
  if (item?.type.startsWith('image/')) {
    const file = item.getAsFile()
    if (file) emit('uploadScreenshot', file)
  }
}

function showTagInputFn() {
  showTagInput.value = true
  nextTick(() => tagInput.value?.focus())
}
</script>

<template>
  <div class="plan-detail" @paste="onPaste">
    <div class="plan-detail-head">
      <div class="plan-detail-eye">
        <IssueBadge :issue-id="item.issue_id" />
        <StatusBadge :status="item.item_status === 'progress' ? 'progress' : item.item_status" />
      </div>
      <textarea
        class="plan-detail-title"
        :value="title"
        placeholder="Item title..."
        rows="2"
        @input="title = ($event.target as HTMLTextAreaElement).value"
        @blur="save('title', title)"
      />
    </div>

    <div class="plan-detail-body">
      <div class="field-row">
        <!-- Ticket ID -->
        <div class="field">
          <div class="field-label">
            <span class="eyebrow">Ticket ID</span>
          </div>
          <input
            class="rm-input"
            type="text"
            :value="issueId"
            placeholder="e.g. PROJ-123"
            @input="issueId = ($event.target as HTMLInputElement).value"
            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            @blur="saveIssueId"
          />
        </div>

        <!-- Presenter -->
        <div class="field">
          <div class="field-label">
            <span class="eyebrow">Presenter</span>
          </div>
          <input
            class="rm-input"
            type="text"
            :value="presenter"
            placeholder="Full name..."
            @input="presenter = ($event.target as HTMLInputElement).value"
            @blur="save('presenter', presenter)"
          />
        </div>
      </div>

      <!-- Screenshots -->
      <div class="field">
        <div class="field-label">
          <span class="eyebrow">Screenshots</span>
          <span class="field-help">⌘V to paste</span>
        </div>
        <div class="shot-list">
          <div
            v-for="(shot, idx) in item.screenshots"
            :key="shot.id"
            class="shot-row"
            :class="{ dragging: shot.id === draggingShotId }"
            draggable="true"
            @dragstart="onShotDragStart(shot.id)"
            @dragover.prevent="(e: DragEvent) => onShotDragOver(e, idx)"
            @drop.prevent="(e: DragEvent) => onShotDrop(e, idx)"
            @dragend="onShotDragEnd"
          >
            <div class="shot-grip">
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                <circle cx="3" cy="3" r="1.2"/><circle cx="7" cy="3" r="1.2"/>
                <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                <circle cx="3" cy="11" r="1.2"/><circle cx="7" cy="11" r="1.2"/>
              </svg>
            </div>
            <img class="shot-thumb" :src="`/api/screenshots/${shot.id}`" :alt="shot.original_name" />
            <textarea
              class="shot-notes rm-textarea"
              :value="screenshotNotes[shot.id] ?? ''"
              placeholder="Notes for this screenshot..."
              rows="2"
              @input="screenshotNotes[shot.id] = ($event.target as HTMLTextAreaElement).value"
              @blur="saveNotes(shot.id)"
            />
            <button class="shot-delete" @click="emit('deleteScreenshot', shot.id)">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="shot-add" @click="fileInput?.click()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Add screenshot
        </div>
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" style="display:none" @change="onFileSelected" />
      </div>

      <!-- Demo URL -->
      <div class="field">
        <div class="field-label">
          <span class="eyebrow">Demo URL</span>
        </div>
        <input
          class="rm-input"
          type="url"
          :value="demoUrl"
          placeholder="https://..."
          @input="demoUrl = ($event.target as HTMLInputElement).value"
          @blur="save('demo_url', demoUrl)"
        />
      </div>

      <!-- Description -->
      <div class="field">
        <div class="field-label">
          <span class="eyebrow">Notes</span>
          <span class="field-help">Markdown</span>
        </div>
        <textarea
          class="rm-textarea"
          :value="description"
          placeholder="Context, scope, links..."
          @input="description = ($event.target as HTMLTextAreaElement).value"
          @blur="save('description', description)"
        />
      </div>

      <!-- Status -->
      <div class="field">
        <div class="field-label">
          <span class="eyebrow">Status</span>
        </div>
        <div class="status-radio">
          <button
            class="status-pill"
            :class="{ on: itemStatus === 'done', 's-done': itemStatus === 'done' }"
            @click="saveStatus('done')"
          >
            <span class="dot dot-mint" style="width:6px;height:6px;" />
            Done
          </button>
          <button
            class="status-pill"
            :class="{ on: itemStatus === 'progress', 's-prog': itemStatus === 'progress' }"
            @click="saveStatus('progress')"
          >
            <span class="dot dot-amber" style="width:6px;height:6px;" />
            In Progress
          </button>
          <button
            class="status-pill"
            :class="{ on: itemStatus === 'blocked', 's-block': itemStatus === 'blocked' }"
            @click="saveStatus('blocked')"
          >
            <span class="dot dot-coral" style="width:6px;height:6px;" />
            Blocked
          </button>
        </div>
      </div>

      <!-- Remove item -->
      <div class="field">
        <div v-if="!confirmingDelete">
          <button class="rm-btn rm-btn-ghost" style="color:var(--coral-50);font-size:var(--text-xs);" @click="confirmingDelete = true">
            Remove item
          </button>
        </div>
        <div v-else class="delete-confirm-row">
          <span style="font-size:var(--text-xs);color:var(--fg-muted);">Remove this item?</span>
          <button class="rm-btn rm-btn-ghost" style="font-size:var(--text-xs);" @click="confirmingDelete = false">Cancel</button>
          <button class="rm-btn rm-btn-ghost" style="color:var(--coral-50);font-size:var(--text-xs);" @click="emit('deleteItem')">Confirm</button>
        </div>
      </div>

      <!-- Tags -->
      <div class="field">
        <div class="field-label">
          <span class="eyebrow">Tags</span>
        </div>
        <div class="tag-list">
          <span v-for="tag in item.tags" :key="tag" class="tag">
            {{ tag }}
            <button class="tag-delete" @click="removeTag(tag)">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </button>
          </span>
          <input
            v-if="showTagInput"
            ref="tagInput"
            v-model="newTag"
            class="rm-input"
            style="width:100px;padding:3px 8px;font-size:11px;"
            placeholder="tag..."
            @keydown.enter.prevent="addTag"
            @keydown.escape="showTagInput = false"
            @blur="addTag"
          />
          <button v-else class="tag-add" @click="showTagInputFn">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1v6M1 4h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delete-confirm-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.shot-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  cursor: grab;
}

.shot-row.dragging {
  opacity: 0.4;
}

.shot-grip {
  display: flex;
  align-items: center;
  padding: 4px 2px;
  color: var(--fg-disabled);
  cursor: grab;
  flex-shrink: 0;
}

.shot-thumb {
  width: 72px;
  height: 54px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.shot-notes {
  flex: 1;
  min-width: 0;
  font-size: var(--text-xs);
  resize: none;
}

.shot-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--fg-muted);
  cursor: pointer;
  font-size: var(--text-xs);
  background: transparent;
}

.shot-add:hover {
  border-color: var(--brand);
  color: var(--fg);
}
</style>
