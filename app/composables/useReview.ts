import type { Review, ReviewItem, ReviewItemWithMedia, ReviewWithItems } from '~/server/types/db'

function normalizeItem(item: Partial<ReviewItemWithMedia>): ReviewItemWithMedia {
  return {
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    screenshots: Array.isArray(item.screenshots) ? item.screenshots : [],
  } as ReviewItemWithMedia
}

function normalizeReview(review: ReviewWithItems | null): ReviewWithItems | null {
  if (!review) return null
  return {
    ...review,
    items: Array.isArray(review.items) ? review.items.map(normalizeItem) : [],
  }
}

function isPlanReview(review: Review) {
  return review.status === 'planned' || review.status === 'plan_finished' || review.status === 'active'
}

export function useCurrentReview() {
  const router = useRouter()
  const route = useRoute()
  const selectedReviewId = computed(() =>
    typeof route.query.review === 'string' ? route.query.review : null
  )

  const { data: current, refresh } = useAsyncData(
    'current-review',
    async () => {
      const reviews = await $fetch<Review[]>('/api/reviews')
      const draftReviews = reviews.filter(r => r.status === 'planned')
      const readyReviews = reviews.filter(r => r.status === 'plan_finished')
      const activeReviews = reviews.filter(r => r.status === 'active')
      const planReviews = [...draftReviews, ...readyReviews, ...activeReviews]
      const currentReview = planReviews.find(r => r.id === selectedReviewId.value)
        ?? draftReviews[0]
        ?? readyReviews[0]
        ?? activeReviews[0]
        ?? null
      if (!currentReview) return { reviews, review: null }

      const detail = await $fetch<ReviewWithItems>(`/api/reviews/${currentReview.id}`)
      return { reviews, review: normalizeReview(detail) }
    },
    {
      default: () => ({ reviews: [], review: null }),
      watch: [selectedReviewId],
    },
  )

  const reviews = computed(() => current.value.reviews)
  const draftReviews = computed(() => reviews.value.filter(r => r.status === 'planned'))
  const readyReviews = computed(() => reviews.value.filter(r => r.status === 'plan_finished'))
  const activeReviews = computed(() => reviews.value.filter(r => r.status === 'active'))
  const plannedReviews = computed(() => reviews.value.filter(isPlanReview))
  const review = computed(() => current.value.review)

  async function selectReview(id: string) {
    await router.replace({ path: '/', query: { ...route.query, review: id } })
  }

  async function addItem(payload: Partial<ReviewItem>) {
    if (!review.value) return
    const item = await $fetch<ReviewItemWithMedia>(`/api/reviews/${review.value.id}/items`, { method: 'POST', body: payload })
    await refresh()
    return normalizeItem(item)
  }

  async function updateItem(id: string, payload: Partial<ReviewItem>) {
    await $fetch(`/api/items/${id}`, { method: 'PUT', body: payload })
    await refresh()
  }

  async function deleteItem(id: string) {
    await $fetch(`/api/items/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function reorderItems(order: string[]) {
    if (!review.value) return
    await $fetch(`/api/reviews/${review.value.id}/items/reorder`, { method: 'PUT', body: { order } })
    await refresh()
  }

  async function startReview() {
    if (!review.value) return
    if (review.value.status !== 'active') {
      await $fetch(`/api/reviews/${review.value.id}`, { method: 'PUT', body: { status: 'active' } })
    }
    await router.push(`/present/${review.value.id}`)
  }

  async function finishPlanning() {
    if (!review.value || review.value.status !== 'planned') return
    await $fetch(`/api/reviews/${review.value.id}`, { method: 'PUT', body: { status: 'plan_finished' } })
    await refresh()
  }

  return {
    review,
    reviews,
    plannedReviews,
    draftReviews,
    readyReviews,
    activeReviews,
    refresh,
    selectReview,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    startReview,
    finishPlanning,
  }
}
