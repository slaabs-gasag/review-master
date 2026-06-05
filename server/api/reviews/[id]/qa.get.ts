import type { QaEntry, ReviewItem } from '../../../types/db'

interface QaEntryWithItem extends QaEntry {
  item_title: string
  item_issue_id: string
}

export default defineEventHandler((event) => {
  const reviewId = getRouterParam(event, 'id')!
  const db = getDb()

  const exists = db.prepare('SELECT id FROM reviews WHERE id = ?').get(reviewId)
  if (!exists) throw createError({ statusCode: 404, message: 'Review not found' })

  return db.prepare(`
    SELECT
      q.id, q.review_id, q.item_id,
      q.author, q.author_role, q.text, q.captured_at,
      ri.title as item_title, ri.issue_id as item_issue_id
    FROM qa_entries q
    JOIN review_items ri ON q.item_id = ri.id
    WHERE q.review_id = ?
    ORDER BY ri.order_index ASC, q.captured_at ASC
  `).all(reviewId) as QaEntryWithItem[]
})
