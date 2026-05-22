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

export function useCurrentReview() {
  const router = useRouter()

  const { data: current, refresh } = useAsyncData(
    'current-review',
    async () => {
      const reviews = await $fetch<Review[]>('/api/reviews')
      const currentReview = reviews.find(r => r.status === 'planned') ?? null
      if (!currentReview) return { reviews, review: null }

      const detail = await $fetch<ReviewWithItems>(`/api/reviews/${currentReview.id}`)
      return { reviews, review: normalizeReview(detail) }
    },
    {
      default: () => ({ reviews: [], review: null }),
    },
  )

  const reviews = computed(() => current.value.reviews)
  const review = computed(() => current.value.review)

  async function addItem(payload: Partial<ReviewItem>) {
    if (!review.value) return
    await $fetch(`/api/reviews/${review.value.id}/items`, { method: 'POST', body: payload })
    await refresh()
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
    await $fetch(`/api/reviews/${review.value.id}`, { method: 'PUT', body: { status: 'active' } })
    await router.push(`/present/${review.value.id}`)
  }

  return { review, reviews, refresh, addItem, updateItem, deleteItem, reorderItems, startReview }
}
