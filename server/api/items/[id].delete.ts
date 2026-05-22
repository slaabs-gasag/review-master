
import { unlinkSync } from 'node:fs'
import type { Screenshot } from '../../types/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const exists = db.prepare('SELECT id FROM review_items WHERE id = ?').get(id)
  if (!exists) throw createError({ statusCode: 404, message: 'Item not found' })

  const screenshots = db.prepare('SELECT * FROM screenshots WHERE item_id = ?').all(id) as Screenshot[]

  db.prepare('DELETE FROM review_items WHERE id = ?').run(id)

  for (const s of screenshots) {
    try { unlinkSync(s.file_path) } catch { /* file may already be gone */ }
  }

  setResponseStatus(event, 204)
  return null
})
