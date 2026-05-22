<script setup lang="ts">
import type { ReviewWithItems, QaEntry } from '~/server/types/db'

definePageMeta({ layout: 'present' })

const route = useRoute()
const router = useRouter()
const reviewId = route.params.id as string

const { data: review, error } = await useFetch<ReviewWithItems>(`/api/reviews/${reviewId}`)

if (!review.value) {
  await navigateTo('/')
}

const currentIndex = ref(0)
const showQA = ref(false)
const showPeek = ref(false)
const completing = ref(false)
const startTime = ref(Date.now())
const elapsed = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => { elapsed.value = Date.now() - startTime.value }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const currentItem = computed(() => review.value?.items[currentIndex.value] ?? null)
const isLast = computed(() => currentIndex.value === (review.value?.items.length ?? 1) - 1)

const qaEnabled = computed(() => !!currentItem.value)
const { data: qaEntries, refresh: refreshQA } = useFetch<QaEntry[]>(
  () => `/api/items/${currentItem.value?.id ?? ''}/qa`,
  { watch: [currentIndex], enabled: qaEnabled }
)

useKeyboardNav({
  onNext: handleNext,
  onPrev: () => { if (currentIndex.value > 0) currentIndex.value-- },
  onEscape: handleExit,
  onQA: () => { showQA.value = !showQA.value },
})

function handleNext() {
  if (!isLast.value) {
    currentIndex.value++
  } else {
    handleComplete()
  }
}

function handleExit() {
  router.push('/')
}

async function handleComplete() {
  if (completing.value) return
  completing.value = true
  try {
    await $fetch(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: { status: 'completed' },
    })
    await navigateTo('/archive')
  } finally {
    completing.value = false
  }
}

async function saveQA(payload: { author: string; author_role: string; text: string }) {
  if (!currentItem.value) return
  await $fetch(`/api/items/${currentItem.value.id}/qa`, { method: 'POST', body: payload })
  await refreshQA()
}

async function deleteQA(id: string) {
  await $fetch(`/api/qa/${id}`, { method: 'DELETE' })
  await refreshQA()
}
</script>

<template>
  <div class="present">
    <div v-if="!review || !currentItem" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--fg-disabled);">
      Loading…
    </div>
    <template v-else>
      <Transition name="slide" mode="out-in">
        <PresenterSlide :key="currentItem.id" :item="currentItem" />
      </Transition>

      <PresenterChrome
        :item="currentItem"
        :index="currentIndex"
        :total="(review.items as any[]).length"
        :elapsed="elapsed"
        :is-archive="false"
        :qa-count="qaEntries?.length ?? 0"
        @prev="() => { if (currentIndex > 0) currentIndex-- }"
        @next="handleNext"
        @exit="handleExit"
        @toggle-q-a="showQA = !showQA"
      />

      <PresenterPeek
        :agenda="review.items"
        :current-index="currentIndex"
        :visible="showPeek"
        @select="(i) => { currentIndex = i; showPeek = false }"
      />

      <QaPanel
        :open="showQA"
        :entries="qaEntries ?? []"
        :is-archive="false"
        @close="showQA = false"
        @save="saveQA"
        @delete="deleteQA"
      />

      <Transition name="fade">
        <div
          v-if="isLast && completing === false"
          style="position:absolute;bottom:90px;left:50%;transform:translateX(-50%);z-index:30;"
        >
          <button class="rm-btn rm-btn-primary" style="padding:12px 28px;" @click="handleComplete">
            End review →
          </button>
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity var(--dur-base); }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
