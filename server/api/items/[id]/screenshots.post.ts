
import { writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 10_485_760

const EXT_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
}

export default defineEventHandler(async (event) => {
  const itemId = getRouterParam(event, 'id')!
  const db = getDb()

  const item = db.prepare('SELECT id FROM review_items WHERE id = ?').get(itemId)
  if (!item) throw createError({ statusCode: 404, message: 'Item not found' })

  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, message: 'No file uploaded' })

  const filePart = parts.find(p => p.name === 'file')
  if (!filePart?.data) throw createError({ statusCode: 400, message: 'file field required' })

  const mime = filePart.type ?? ''
  if (!ALLOWED_TYPES.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Only PNG, JPEG, and WebP images are allowed' })
  }
  if (filePart.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: 'File exceeds 10 MB limit' })
  }

  const id = crypto.randomUUID()
  const ext = EXT_MAP[mime] ?? (extname(filePart.filename ?? '') || '.jpg')
  const file_path = join(SCREENSHOTS_DIR, `${id}${ext}`)

  writeFileSync(file_path, filePart.data)

  const maxRow = db.prepare(
    'SELECT COALESCE(MAX(order_index), -1) as max_idx FROM screenshots WHERE item_id = ?'
  ).get(itemId) as { max_idx: number }

  const created_at = Date.now()
  db.prepare(
    'INSERT INTO screenshots (id, item_id, file_path, original_name, mime_type, size_bytes, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, itemId, file_path, filePart.filename ?? 'screenshot', mime, filePart.data.length, maxRow.max_idx + 1, created_at)

  setResponseStatus(event, 201)
  return { id, item_id: itemId, original_name: filePart.filename ?? 'screenshot', mime_type: mime, size_bytes: filePart.data.length, order_index: maxRow.max_idx + 1, created_at }
})
