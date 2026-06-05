import type { Screenshot } from '../../types/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const shot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(id) as Screenshot | undefined
  if (!shot) throw createError({ statusCode: 404, message: 'Screenshot not found' })

  const notes = body.notes !== undefined ? (body.notes === null ? null : String(body.notes)) : shot.notes

  db.prepare('UPDATE screenshots SET notes = ? WHERE id = ?').run(notes, id)

  return { ...shot, notes }
})
