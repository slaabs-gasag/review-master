
import type { Review } from '../../types/db'

const STATUS_ORDER = { planned: 0, plan_finished: 1, active: 2, completed: 3 }
const VALID_STATUSES = Object.keys(STATUS_ORDER)
const ALLOWED_TRANSITIONS: Record<Review['status'], Review['status'][]> = {
  planned: ['planned', 'plan_finished'],
  plan_finished: ['plan_finished', 'active'],
  active: ['active', 'plan_finished', 'completed'],
  completed: ['completed'],
}

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
    if (!VALID_STATUSES.includes(newStatus)) {
      throw createError({ statusCode: 400, message: 'Invalid status value' })
    }
    if (review.status === 'completed' && newStatus !== 'completed') {
      throw createError({ statusCode: 409, message: 'Completed reviews cannot be changed' })
    }
    const isAbortingActiveReview = review.status === 'active' && newStatus === 'plan_finished'
    if (!ALLOWED_TRANSITIONS[review.status].includes(newStatus as Review['status'])) {
      const order = STATUS_ORDER[newStatus as keyof typeof STATUS_ORDER] < STATUS_ORDER[review.status] ? 'Backward ' : ''
      throw createError({ statusCode: 409, message: `${order}status transition is not allowed` })
    }
    updates.status = newStatus
    if (isAbortingActiveReview) {
      updates.started_at = null
      updates.duration_ms = null
    }
    const now = Date.now()
    if (newStatus === 'active' && review.status === 'plan_finished') {
      updates.started_at = now
    }
    if (newStatus === 'completed' && review.status === 'active') {
      updates.completed_at = now
      updates.duration_ms = review.started_at ? now - review.started_at : null
    }
  }

  if (Object.keys(updates).length === 0) {
    return review
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE reviews SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), id)

  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)
})
