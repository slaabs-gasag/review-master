
import { createReadStream, existsSync } from 'node:fs'
import type { Screenshot } from '../../types/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const shot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(id) as Screenshot | undefined
  if (!shot) throw createError({ statusCode: 404, message: 'Screenshot not found' })
  if (!existsSync(shot.file_path)) throw createError({ statusCode: 404, message: 'Screenshot file not found' })

  setHeader(event, 'Content-Type', shot.mime_type)
  setHeader(event, 'Cache-Control', 'private, max-age=86400')

  return sendStream(event, createReadStream(shot.file_path))
})
