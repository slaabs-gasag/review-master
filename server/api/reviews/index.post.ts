export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = body?.name?.trim() ?? ''
  const sprint = body?.sprint?.trim() ?? ''
  const team = body?.team?.trim() ?? ''
  const description = body?.description?.trim() ?? ''
  const reviewDateStr: string | undefined = body?.review_date

  if (!name || !sprint) {
    throw createError({ statusCode: 400, message: 'name and sprint are required' })
  }

  const db = getDb()
  const id = crypto.randomUUID()
  const created_at = Date.now()

  let review_date: number | null = null
  if (reviewDateStr) {
    const parsed = new Date(reviewDateStr + 'T12:00:00').getTime()
    if (!Number.isNaN(parsed)) review_date = parsed
  }

  db.prepare(
    'INSERT INTO reviews (id, name, sprint, team, description, status, created_at, review_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, sprint, team, description, 'planned', created_at, review_date)

  setResponseStatus(event, 201)
  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)
})
