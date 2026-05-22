
import type { Review, ReviewItem, Screenshot } from '../../types/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Review | undefined
  if (!review) throw createError({ statusCode: 404, message: 'Review not found' })

  const items = db.prepare(
    'SELECT * FROM review_items WHERE review_id = ? ORDER BY order_index ASC'
  ).all(id) as ReviewItem[]

  const screenshots = db.prepare(
    'SELECT s.* FROM screenshots s JOIN review_items ri ON s.item_id = ri.id WHERE ri.review_id = ? ORDER BY s.order_index ASC'
  ).all(id) as Screenshot[]

  const screenshotsByItem = new Map<string, Screenshot[]>()
  for (const s of screenshots) {
    const arr = screenshotsByItem.get(s.item_id) ?? []
    arr.push(s)
    screenshotsByItem.set(s.item_id, arr)
  }

  return {
    ...review,
    items: items.map(item => ({
      ...item,
      tags: JSON.parse((item.tags as unknown as string) || '[]') as string[],
      screenshots: screenshotsByItem.get(item.id) ?? [],
    })),
  }
})
