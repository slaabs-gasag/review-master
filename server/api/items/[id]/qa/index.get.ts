export default defineEventHandler((event) => {
  const itemId = getRouterParam(event, 'id')!
  const db = getDb()
  return db.prepare('SELECT * FROM qa_entries WHERE item_id = ? ORDER BY captured_at ASC').all(itemId)
})
