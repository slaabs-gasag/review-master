export default defineEventHandler(() => {
  const db = getDb()
  return db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all()
})
