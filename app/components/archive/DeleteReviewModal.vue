<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  reviewName?: string | null
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  confirm: []
}>()

let previousBodyOverflow: string | null = null

function close() {
  if (!props.loading) open.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (!import.meta.client) return

  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)
    return
  }

  document.body.style.overflow = previousBodyOverflow ?? ''
  previousBodyOverflow = null
  window.removeEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return

  document.body.style.overflow = previousBodyOverflow ?? ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="delete-modal-overlay" @click.self="close">
      <section
        class="delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
      >
        <div class="delete-modal-head">
          <div>
            <h2 id="delete-modal-title">Delete "{{ reviewName || 'review' }}"?</h2>
            <p id="delete-modal-description">
              This will permanently delete the review and all its items, screenshots, and notes. This cannot be undone.
            </p>
          </div>
          <button class="rm-icon-btn delete-modal-close" type="button" :disabled="loading" aria-label="Close" @click="close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="delete-modal-foot">
          <span v-if="error" class="delete-modal-error">{{ error }}</span>
          <button class="rm-btn rm-btn-ghost" type="button" :disabled="loading" @click="close">Cancel</button>
          <button class="rm-btn rm-btn-danger" type="button" :disabled="loading" @click="emit('confirm')">
            {{ loading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>