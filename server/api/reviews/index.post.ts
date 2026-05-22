export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = body?.name?.trim() ?? ''
  const sprint = body?.sprint?.trim() ?? ''
  const team = body?.team?.trim() ?? ''
  const description = body?.description?.trim() ?? ''

  if (!name || !sprint) {
    throw createError({ statusCode: 400, message: 'name and sprint are required' })
  }

  const db = getDb()
  const id = crypto.randomUUID()
  const created_at = Date.now()

  db.prepare(
    'INSERT INTO reviews (id, name, sprint, team, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, sprint, team, description, 'planned', created_at)

  setResponseStatus(event, 201)
  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)
})
