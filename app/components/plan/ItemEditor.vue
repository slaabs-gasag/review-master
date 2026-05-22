<script setup lang="ts">
import type { ReviewItemWithMedia } from '~/server/types/db'

const props = defineProps<{ item: ReviewItemWithMedia }>()
const emit = defineEmits<{
  update: [payload: Partial<ReviewItemWithMedia>]
  uploadScreenshot: [file: File]
  deleteScreenshot: [id: string]
}>()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const title = ref(props.item.title)
const presenter = ref(props.item.presenter)
const description = ref(props.item.description)
const demoUrl = ref(props.item.demo_url)
const itemStatus = ref(props.item.item_status)
const newTag = ref('')
const showTagInput = ref(false)
const tagInput = useTemplateRef<HTMLInputElement>('tagInput')

watch(() => props.item, (item) => {
  title.value = item.title
  presenter.value = item.presenter
  description.value = item.description
  demoUrl.value = item.demo_url
  itemStatus.value = item.item_status
})

function save(field: string, value: unknown) {
  emit('update', { [field]: value })
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

      <!-- Screenshots -->
      <div class="field">
        <div class="field-label">
          <span class="eyebrow">Screenshots</span>
          <span class="field-help">⌘V to paste</span>
        </div>
        <div class="shots-grid">
          <div
            v-for="shot in item.screenshots"
            :key="shot.id"
            class="shot"
          >
            <img :src="`/api/screenshots/${shot.id}`" style="width:100%;height:100%;object-fit:cover;" :alt="shot.original_name" />
            <button class="shot-delete" @click="emit('deleteScreenshot', shot.id)">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="shot add" @click="fileInput?.click()">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
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
