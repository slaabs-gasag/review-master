export default defineEventHandler(async (event) => {
  const itemId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const item = db.prepare('SELECT id, review_id FROM review_items WHERE id = ?').get(itemId) as { id: string; review_id: string } | undefined
  if (!item) throw createError({ statusCode: 404, message: 'Item not found' })

  const text = body?.text?.trim() ?? ''
  if (!text) throw createError({ statusCode: 400, message: 'text is required' })

  const id = crypto.randomUUID()
  const captured_at = Date.now()
  const author = body?.author?.trim() ?? ''
  const author_role = body?.author_role?.trim() ?? ''

  db.prepare(
    'INSERT INTO qa_entries (id, review_id, item_id, author, author_role, text, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, item.review_id, itemId, author, author_role, text, captured_at)

  setResponseStatus(event, 201)
  return db.prepare('SELECT * FROM qa_entries WHERE id = ?').get(id)
})
