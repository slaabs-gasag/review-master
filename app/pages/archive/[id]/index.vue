<script setup lang="ts">
import type { ReviewWithItems, ReviewItemWithMedia } from '~/server/types/db'

definePageMeta({ layout: 'default' })

const route = useRoute()
const reviewId = route.params.id as string

const { data: review, error } = await useFetch<ReviewWithItems>(`/api/reviews/${reviewId}`)

if (!review.value) await navigateTo('/archive')

const selectedId = ref<string | null>(review.value?.items[0]?.id ?? null)

const selectedItem = computed<ReviewItemWithMedia | null>(() =>
  review.value?.items.find(i => i.id === selectedId.value) ?? null
)

// Delete
const deleteOpen = ref(false)
const deleteError = ref<string | null>(null)
const deleteLoading = ref(false)

async function confirmDelete() {
  deleteLoading.value = true
  deleteError.value = null
  try {
    await $fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
    await navigateTo('/archive')
  }
  catch {
    deleteError.value = 'Deletion failed. Please try again.'
  }
  finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div v-if="!review" class="empty-state">
    <h3>Review not found</h3>
    <NuxtLink to="/archive" class="rm-btn rm-btn-ghost">← Back to archive</NuxtLink>
  </div>

  <div v-else class="plan">
    <!-- Left column: read-only agenda -->
    <div class="plan-list">
      <div class="plan-list-head">
        <div class="plan-head-meta">
          <div class="plan-head-title">{{ review.name }}</div>
          <div class="plan-head-sub">
            <span class="chip chip-neutral">Sprint {{ review.sprint }}</span>
            <span v-if="review.team" style="color:var(--fg-subtle)">{{ review.team }}</span>
          </div>
        </div>
        <div class="plan-head-actions">
          <NuxtLink to="/archive" class="rm-btn rm-btn-ghost" style="font-size:var(--text-xs);">← Archive</NuxtLink>
          <button class="rm-btn rm-btn-ghost" style="font-size:var(--text-xs);color:var(--fg-subtle);" @click="deleteOpen = true">Delete</button>
          <NuxtLink :to="`/archive/${reviewId}/present`" class="rm-btn rm-btn-primary" style="font-size:var(--text-xs);">Re-watch →</NuxtLink>
        </div>
      </div>

      <div class="plan-list-eyebrow">
        <span class="eyebrow">Agenda</span>
        <span class="eyebrow" style="color:var(--fg-disabled)">{{ review.items.length }} items</span>
      </div>

      <div class="plan-list-body">
        <div
          v-for="(item, idx) in review.items"
          :key="item.id"
          class="agenda-item"
          :class="{ on: item.id === selectedId }"
          @click="selectedId = item.id"
        >
          <div class="agenda-idx-id">
            <span class="agenda-idx">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="agenda-id">{{ item.issue_id }}</span>
          </div>
          <div class="agenda-main">
            <div class="agenda-title">{{ item.title || item.issue_id }}</div>
            <div class="agenda-meta-row">
              <span v-if="item.screenshots.length" class="meta-tag">📷 {{ item.screenshots.length }}</span>
            </div>
          </div>
          <div class="agenda-presenter">
            <AvatarGradient :name="item.presenter || '?'" size="sm" />
          </div>
          <div class="agenda-status">
            <StatusBadge :status="item.item_status === 'progress' ? 'progress' : item.item_status" />
          </div>
        </div>
      </div>
    </div>

    <!-- Right column: read-only item detail -->
    <div v-if="selectedItem" class="plan-detail">
      <div class="plan-detail-head">
        <div class="plan-detail-eye">
          <IssueBadge :issue-id="selectedItem.issue_id" />
          <StatusBadge :status="selectedItem.item_status === 'progress' ? 'progress' : selectedItem.item_status" />
        </div>
        <div class="plan-detail-title" style="resize:none;pointer-events:none;">{{ selectedItem.title }}</div>
      </div>

      <div class="plan-detail-body">
        <div v-if="selectedItem.presenter" class="field">
          <span class="eyebrow">Presenter</span>
          <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
            <AvatarGradient :name="selectedItem.presenter" size="md" />
            <span style="color:var(--fg);font-size:var(--text-sm);">{{ selectedItem.presenter }}</span>
          </div>
        </div>

        <div v-if="selectedItem.screenshots.length" class="field">
          <span class="eyebrow">Screenshots</span>
          <div class="shots-grid" style="margin-top:8px;">
            <div v-for="shot in selectedItem.screenshots" :key="shot.id" class="shot">
              <img :src="`/api/screenshots/${shot.id}`" style="width:100%;height:100%;object-fit:cover;" :alt="shot.original_name" />
            </div>
          </div>
        </div>

        <div v-if="selectedItem.demo_url" class="field">
          <span class="eyebrow">Demo</span>
          <a :href="selectedItem.demo_url" target="_blank" rel="noopener" style="color:var(--brand-soft);font-size:var(--text-sm);">
            {{ selectedItem.demo_url }} ↗
          </a>
        </div>

        <div v-if="selectedItem.description" class="field">
          <span class="eyebrow">Notes</span>
          <p style="color:var(--fg-muted);font-size:var(--text-sm);white-space:pre-wrap;margin-top:4px;">{{ selectedItem.description }}</p>
        </div>

        <div v-if="selectedItem.tags.length" class="field">
          <span class="eyebrow">Tags</span>
          <div class="tag-list" style="margin-top:8px;">
            <span v-for="tag in selectedItem.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="plan-detail" style="display:flex;align-items:center;justify-content:center;">
      <p style="color:var(--fg-disabled);font-size:var(--text-sm);">Select an item to view</p>
    </div>
  </div>

  <DeleteReviewModal
    v-model:open="deleteOpen"
    :review-name="review?.name"
    :loading="deleteLoading"
    :error="deleteError"
    @confirm="confirmDelete"
  />
</template>
