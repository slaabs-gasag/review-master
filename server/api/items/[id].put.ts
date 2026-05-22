
import type { ReviewItem } from '../../types/db'

const VALID_STATUSES = ['done', 'progress', 'blocked']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const item = db.prepare('SELECT * FROM review_items WHERE id = ?').get(id) as (ReviewItem & { tags: string }) | undefined
  if (!item) throw createError({ statusCode: 404, message: 'Item not found' })

  const updates: Record<string, unknown> = {}
  if (body.issue_id !== undefined) updates.issue_id = String(body.issue_id).trim()
  if (body.title !== undefined) updates.title = String(body.title).trim()
  if (body.presenter !== undefined) updates.presenter = String(body.presenter).trim()
  if (body.description !== undefined) updates.description = String(body.description)
  if (body.demo_url !== undefined) {
    const url = String(body.demo_url).trim()
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      throw createError({ statusCode: 400, message: 'demo_url must start with http:// or https://' })
    }
    updates.demo_url = url
  }
  if (body.item_status !== undefined) {
    if (!VALID_STATUSES.includes(body.item_status)) {
      throw createError({ statusCode: 400, message: 'Invalid item_status' })
    }
    updates.item_status = body.item_status
  }
  if (body.tags !== undefined) {
    updates.tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : [])
  }

  if (Object.keys(updates).length > 0) {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ')
    db.prepare(`UPDATE review_items SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), id)
  }

  const updated = db.prepare('SELECT * FROM review_items WHERE id = ?').get(id) as ReviewItem & { tags: string }
  return { ...updated, tags: JSON.parse(updated.tags || '[]') }
})
