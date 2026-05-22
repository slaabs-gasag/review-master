
import { unlinkSync } from 'node:fs'
import type { Screenshot } from '../../types/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const exists = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id)
  if (!exists) throw createError({ statusCode: 404, message: 'Review not found' })

  const screenshots = db.prepare(
    'SELECT s.* FROM screenshots s JOIN review_items ri ON s.item_id = ri.id WHERE ri.review_id = ?'
  ).all(id) as Screenshot[]

  db.prepare('DELETE FROM reviews WHERE id = ?').run(id)

  for (const s of screenshots) {
    try { unlinkSync(s.file_path) } catch { /* file may already be gone */ }
  }

  setResponseStatus(event, 204)
  return null
})
