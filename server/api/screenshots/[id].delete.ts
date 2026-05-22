
import { unlinkSync } from 'node:fs'
import type { Screenshot } from '../../types/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const shot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(id) as Screenshot | undefined
  if (!shot) throw createError({ statusCode: 404, message: 'Screenshot not found' })

  db.prepare('DELETE FROM screenshots WHERE id = ?').run(id)
  try { unlinkSync(shot.file_path) } catch { /* file may already be gone */ }

  setResponseStatus(event, 204)
  return null
})
