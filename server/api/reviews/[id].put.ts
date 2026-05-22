
import type { Review } from '../../types/db'

const STATUS_ORDER = { planned: 0, active: 1, completed: 2 }

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Review | undefined
  if (!review) throw createError({ statusCode: 404, message: 'Review not found' })

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = String(body.name).trim()
  if (body.sprint !== undefined) updates.sprint = String(body.sprint).trim()
  if (body.team !== undefined) updates.team = String(body.team).trim()
  if (body.description !== undefined) updates.description = String(body.description)

  if (body.status !== undefined) {
    const newStatus = body.status as string
    if (!['planned', 'active', 'completed'].includes(newStatus)) {
      throw createError({ statusCode: 400, message: 'Invalid status value' })
    }
    if (STATUS_ORDER[newStatus as keyof typeof STATUS_ORDER] < STATUS_ORDER[review.status]) {
      throw createError({ statusCode: 409, message: 'Backward status transitions are not allowed' })
    }
    updates.status = newStatus
    if (newStatus === 'active' && review.status === 'planned') {
      updates.started_at = Date.now()
    }
    if (newStatus === 'completed' && review.status === 'active') {
      updates.completed_at = Date.now()
      updates.duration_ms = review.started_at ? Date.now() - review.started_at : null
    }
  }

  if (Object.keys(updates).length === 0) {
    return review
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE reviews SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), id)

  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)
})
