import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const TEST_DB_DIR = resolve('/tmp/review-master-test')
const TEST_DB_PATH = resolve(TEST_DB_DIR, 'test.sqlite')

function createTestDb() {
  mkdirSync(TEST_DB_DIR, { recursive: true })
  const db = new Database(TEST_DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sprint TEXT NOT NULL,
      team TEXT NOT NULL DEFAULT '', description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planned', created_at INTEGER NOT NULL,
      started_at INTEGER, completed_at INTEGER, duration_ms INTEGER
    );
    CREATE TABLE IF NOT EXISTS review_items (
      id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      issue_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', presenter TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '', demo_url TEXT DEFAULT '', item_status TEXT NOT NULL DEFAULT 'progress',
      tags TEXT DEFAULT '[]', order_index INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL, original_name TEXT NOT NULL, mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL, order_index INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS qa_entries (
      id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
      author TEXT NOT NULL DEFAULT '', author_role TEXT DEFAULT '',
      text TEXT NOT NULL, captured_at INTEGER NOT NULL
    );
  `)
  return db
}

describe('DB schema', () => {
  let db: Database.Database

  beforeEach(() => { db = createTestDb() })
  afterEach(() => {
    db.close()
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH)
  })

  it('creates all four tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]
    const names = tables.map(t => t.name)
    expect(names).toContain('reviews')
    expect(names).toContain('review_items')
    expect(names).toContain('screenshots')
    expect(names).toContain('qa_entries')
  })

  it('inserts and retrieves a review', () => {
    const id = 'test-id-1'
    db.prepare('INSERT INTO reviews (id, name, sprint, created_at) VALUES (?, ?, ?, ?)').run(id, 'Test Review', '1', Date.now())
    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any
    expect(row.name).toBe('Test Review')
    expect(row.status).toBe('planned')
  })

  it('cascade deletes items when review deleted', () => {
    const rid = 'rev-1'
    const iid = 'item-1'
    db.prepare('INSERT INTO reviews (id, name, sprint, created_at) VALUES (?, ?, ?, ?)').run(rid, 'R', '1', Date.now())
    db.prepare('INSERT INTO review_items (id, review_id, issue_id, created_at) VALUES (?, ?, ?, ?)').run(iid, rid, 'T-1', Date.now())

    const item = db.prepare('SELECT id FROM review_items WHERE id = ?').get(iid)
    expect(item).toBeTruthy()

    db.prepare('DELETE FROM reviews WHERE id = ?').run(rid)
    const deleted = db.prepare('SELECT id FROM review_items WHERE id = ?').get(iid)
    expect(deleted).toBeUndefined()
  })

  it('assigns sequential order_index', () => {
    const rid = 'rev-2'
    db.prepare('INSERT INTO reviews (id, name, sprint, created_at) VALUES (?, ?, ?, ?)').run(rid, 'R', '2', Date.now())
    for (let i = 0; i < 3; i++) {
      const maxRow = db.prepare('SELECT COALESCE(MAX(order_index), -1) as max_idx FROM review_items WHERE review_id = ?').get(rid) as { max_idx: number }
      db.prepare('INSERT INTO review_items (id, review_id, issue_id, order_index, created_at) VALUES (?, ?, ?, ?, ?)').run(`item-${i}`, rid, `T-${i}`, maxRow.max_idx + 1, Date.now())
    }
    const items = db.prepare('SELECT order_index FROM review_items WHERE review_id = ? ORDER BY order_index').all(rid) as { order_index: number }[]
    expect(items.map(i => i.order_index)).toEqual([0, 1, 2])
  })
})
