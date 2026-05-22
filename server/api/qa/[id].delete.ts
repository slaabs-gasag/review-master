export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const exists = db.prepare('SELECT id FROM qa_entries WHERE id = ?').get(id)
  if (!exists) throw createError({ statusCode: 404, message: 'Q&A entry not found' })

  db.prepare('DELETE FROM qa_entries WHERE id = ?').run(id)
  setResponseStatus(event, 204)
  return null
})
