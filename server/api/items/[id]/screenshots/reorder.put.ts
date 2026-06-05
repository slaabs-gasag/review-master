export default defineEventHandler(async (event) => {
  const itemId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const db = getDb()

  const exists = db.prepare('SELECT id FROM review_items WHERE id = ?').get(itemId)
  if (!exists) throw createError({ statusCode: 404, message: 'Item not found' })

  const order: string[] = body?.order
  if (!Array.isArray(order)) throw createError({ statusCode: 400, message: 'order must be an array of screenshot IDs' })

  const currentShots = db.prepare('SELECT id FROM screenshots WHERE item_id = ?').all(itemId) as { id: string }[]
  const currentIds = new Set(currentShots.map(s => s.id))

  if (order.length !== currentIds.size || !order.every(id => currentIds.has(id))) {
    throw createError({ statusCode: 400, message: 'order must contain exactly the current screenshot IDs' })
  }

  const update = db.prepare('UPDATE screenshots SET order_index = ? WHERE id = ?')
  const updateAll = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => update.run(idx, id))
  })
  updateAll(order)

  return { ok: true }
})
