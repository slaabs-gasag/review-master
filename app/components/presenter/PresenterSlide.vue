<script setup lang="ts">
import { formatGermanDate } from '~/utils/date'
import type { ReviewItemWithMedia, ReviewWithItems } from '~/server/types/db'

const props = defineProps<{
  review?: ReviewWithItems
  item?: ReviewItemWithMedia
  isCover?: boolean
  isAgenda?: boolean
  isEnd?: boolean
  screenshotIndex?: number
}>()

const items = computed(() => props.review?.items ?? [])
const itemCount = computed(() => items.value.length)
const itemCountLabel = computed(() => `${itemCount.value} ${itemCount.value === 1 ? 'Item' : 'Items'}`)
const reviewDate = computed(() => formatGermanDate(props.review?.review_date ?? props.review?.started_at ?? props.review?.created_at))

const shot = computed(() => {
  if (props.screenshotIndex === undefined || !props.item) return null
  return props.item.screenshots[props.screenshotIndex] ?? null
})
</script>

<template>
  <div class="present-stage">
    <div class="present-media">
      <template v-if="isCover && review">
        <div class="present-cover">
          <div class="present-cover-label">Sprint Review</div>
          <h1 class="present-cover-title">{{ review.name }}</h1>
          <div class="present-cover-meta">
            <div class="present-cover-stat">
              <span>Date</span>
              <strong>{{ reviewDate }}</strong>
            </div>
            <div class="present-cover-stat">
              <span>Team</span>
              <strong>{{ review.team || 'Team' }}</strong>
            </div>
            <div class="present-cover-stat">
              <span>Agenda</span>
              <strong>{{ itemCountLabel }}</strong>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="isAgenda && review">
        <div class="present-agenda">
          <div class="present-cover-label">Agenda</div>
          <h1 class="present-agenda-title">{{ itemCountLabel }}</h1>
          <div class="present-agenda-list">
            <div
              v-for="(agendaItem, index) in items"
              :key="agendaItem.id"
              class="present-agenda-item"
            >
              <span class="present-agenda-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="present-agenda-main">
                <div class="present-agenda-item-title">{{ agendaItem.title || agendaItem.issue_id }}</div>
                <div class="present-agenda-issue">{{ agendaItem.issue_id }}</div>
              </div>
              <div class="present-agenda-presenter">
                <AvatarGradient :name="agendaItem.presenter || '?'" size="sm" />
                <span>{{ agendaItem.presenter || 'Unknown presenter' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="isEnd">
        <div class="present-end">
          <div class="present-end-label">Sprint Review</div>
          <h1 class="present-end-title">Danke</h1>
          <p class="present-end-question">Gibt es noch Fragen?</p>
        </div>
      </template>
      <template v-else-if="shot">
        <img
          :src="`/api/screenshots/${shot.id}`"
          class="present-media-inner"
          style="object-fit: contain;"
          :alt="shot.original_name"
        />
        <div v-if="shot.notes" class="present-shot-notes">
          {{ shot.notes }}
        </div>
      </template>
      <template v-else-if="item">
        <div class="present-intro">
          <div class="present-intro-kicker">
            <IssueBadge :issue-id="item.issue_id" />
            <StatusBadge :status="item.item_status === 'progress' ? 'progress' : item.item_status" />
          </div>

          <h1 class="present-intro-title">{{ item.title || item.issue_id }}</h1>

          <p v-if="item.description" class="present-intro-description">
            {{ item.description }}
          </p>
          <p v-else class="present-intro-description muted">
            No description provided.
          </p>

          <div class="present-intro-presenter">
            <AvatarGradient :name="item.presenter || '?'" size="md" />
            <div>
              <div class="presenter-name">{{ item.presenter || 'Unknown presenter' }}</div>
              <div class="presenter-role">Presenter</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.present-shot-notes {
  position: absolute;
  bottom: 72px;
  left: 0;
  right: 0;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  backdrop-filter: blur(4px);
  white-space: pre-wrap;
  z-index: 11;
}
</style>
