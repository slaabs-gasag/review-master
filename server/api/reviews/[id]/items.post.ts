
import type { Review, ReviewItem } from '../../../types/db'

const VALID_STATUSES = ['done', 'progress', 'blocked']

export default defineEventHandler(async (event) => {
  const reviewId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId) as Review | undefined
  if (!review) throw createError({ statusCode: 404, message: 'Review not found' })
  if (review.status !== 'planned' && review.status !== 'plan_finished') {
    throw createError({ statusCode: 409, message: 'Items can only be added to planned reviews' })
  }

  const issue_id = body?.issue_id?.trim() ?? ''
  if (!issue_id) throw createError({ statusCode: 400, message: 'issue_id is required' })

  const item_status = body?.item_status ?? 'progress'
  if (!VALID_STATUSES.includes(item_status)) {
    throw createError({ statusCode: 400, message: 'Invalid item_status' })
  }

  const demo_url = body?.demo_url?.trim() ?? ''
  if (demo_url && !demo_url.startsWith('http://') && !demo_url.startsWith('https://')) {
    throw createError({ statusCode: 400, message: 'demo_url must start with http:// or https://' })
  }

  const maxRow = db.prepare(
    'SELECT COALESCE(MAX(order_index), -1) as max_idx FROM review_items WHERE review_id = ?'
  ).get(reviewId) as { max_idx: number }
  const order_index = maxRow.max_idx + 1

  const id = crypto.randomUUID()
  const created_at = Date.now()
  const tags = JSON.stringify(Array.isArray(body?.tags) ? body.tags : [])

  db.prepare(
    'INSERT INTO review_items (id, review_id, issue_id, title, presenter, description, demo_url, item_status, tags, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, reviewId, issue_id,
    body?.title?.trim() ?? '',
    body?.presenter?.trim() ?? '',
    body?.description ?? '',
    demo_url,
    item_status,
    tags,
    order_index,
    created_at,
  )

  setResponseStatus(event, 201)
  const item = db.prepare('SELECT * FROM review_items WHERE id = ?').get(id) as ReviewItem & { tags: string }
  return { ...item, tags: JSON.parse(item.tags || '[]') }
})
