<script setup lang="ts">
import type { ReviewWithItems, QaEntry } from '~/server/types/db'

definePageMeta({ layout: 'present' })

const route = useRoute()
const router = useRouter()
const reviewId = route.params.id as string

const { data: review } = await useFetch<ReviewWithItems>(`/api/reviews/${reviewId}`)

if (!review.value) await navigateTo('/archive')

const currentIndex = ref(0)
const showQA = ref(false)
const showPeek = ref(false)
const elapsed = ref(0)

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => { elapsed.value += 1000 }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const slides = computed(() => buildPresentationSlides(review.value))
const currentSlide = computed(() => slides.value[currentIndex.value] ?? null)
const currentItem = computed(() => currentSlide.value?.item ?? null)
const isLast = computed(() => currentIndex.value === slides.value.length - 1)
const chromeLabel = computed(() => {
  if (currentSlide.value?.kind === 'cover') return 'Review'
  if (currentSlide.value?.kind === 'agenda') return 'Agenda'
  return undefined
})
const chromeTitle = computed(() => {
  if (currentSlide.value?.kind === 'cover') return review.value?.name
  if (currentSlide.value?.kind === 'agenda') return 'Agenda'
  return undefined
})

const qaEnabled = computed(() => !!currentItem.value)
const { data: qaEntries } = useFetch<QaEntry[]>(
  () => `/api/items/${currentItem.value?.id ?? ''}/qa`,
  { watch: [currentIndex], enabled: qaEnabled }
)

useKeyboardNav({
  onNext: () => { if (!isLast.value) currentIndex.value++ },
  onPrev: () => { if (currentIndex.value > 0) currentIndex.value-- },
  onEscape: () => router.push(`/archive/${reviewId}`),
  onQA: () => { showQA.value = !showQA.value },
})
</script>

<template>
  <div class="present">
    <!-- Archive top bar -->
    <div style="position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:rgba(4,8,26,0.7);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);">
      <NuxtLink :to="`/archive/${reviewId}`" class="rm-btn rm-btn-ghost" style="font-size:var(--text-xs);">← Back to archive</NuxtLink>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--fg-subtle);">Sprint {{ review?.sprint }}</span>
        <span class="chip chip-neutral">read-only</span>
      </div>
    </div>

    <div v-if="!review || !currentSlide" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--fg-disabled);">
      Loading…
    </div>

    <template v-else>
      <Transition name="slide" mode="out-in">
        <PresenterSlide
          :key="currentSlide.id"
          :review="currentSlide.review"
          :item="currentSlide.item"
          :is-cover="currentSlide.kind === 'cover'"
          :is-agenda="currentSlide.kind === 'agenda'"
          :is-end="currentSlide.kind === 'end'"
          :screenshot-index="currentSlide?.screenshotIndex"
        />
      </Transition>

      <PresenterChrome
        v-if="currentSlide.kind !== 'end'"
        :item="currentItem"
        :label="chromeLabel"
        :title="chromeTitle"
        :index="currentIndex"
        :total="slides.length"
        :elapsed="elapsed"
        :is-archive="true"
        :qa-count="qaEntries?.length ?? 0"
        @prev="() => { if (currentIndex > 0) currentIndex-- }"
        @next="() => { if (!isLast) currentIndex++ }"
        @exit="router.push(`/archive/${reviewId}`)"
        @toggle-q-a="showQA = !showQA"
      />

      <PresenterPeek
        :slides="slides"
        :current-index="currentIndex"
        :visible="showPeek"
        @select="(i) => { currentIndex = i; showPeek = false }"
      />

      <QaPanel
        :open="showQA"
        :entries="qaEntries ?? []"
        :is-archive="true"
        @close="showQA = false"
        @save="() => {}"
        @delete="() => {}"
      />
    </template>
  </div>
</template>
