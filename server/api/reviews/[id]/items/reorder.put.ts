export default defineEventHandler(async (event) => {
  const reviewId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const exists = db.prepare('SELECT id FROM reviews WHERE id = ?').get(reviewId)
  if (!exists) throw createError({ statusCode: 404, message: 'Review not found' })

  const order: string[] = body?.order
  if (!Array.isArray(order)) throw createError({ statusCode: 400, message: 'order must be an array of item IDs' })

  const currentItems = db.prepare('SELECT id FROM review_items WHERE review_id = ?').all(reviewId) as { id: string }[]
  const currentIds = new Set(currentItems.map(i => i.id))

  if (order.length !== currentIds.size || !order.every(id => currentIds.has(id))) {
    throw createError({ statusCode: 400, message: 'order must contain exactly the current item IDs' })
  }

  const update = db.prepare('UPDATE review_items SET order_index = ? WHERE id = ?')
  const updateAll = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => update.run(idx, id))
  })
  updateAll(order)

  return { ok: true }
})
