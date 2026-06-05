import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const DB_PATH = resolve('.data/review-master.sqlite')
const SCREENSHOTS_DIR = resolve('.data/screenshots')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  mkdirSync(resolve('.data'), { recursive: true })
  mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  _db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id           TEXT    PRIMARY KEY,
      name         TEXT    NOT NULL,
      sprint       TEXT    NOT NULL,
      team         TEXT    NOT NULL DEFAULT '',
      description  TEXT    DEFAULT '',
      status       TEXT    NOT NULL DEFAULT 'planned',
      created_at   INTEGER NOT NULL,
      started_at   INTEGER,
      completed_at INTEGER,
      duration_ms  INTEGER
    );

    CREATE TABLE IF NOT EXISTS review_items (
      id           TEXT    PRIMARY KEY,
      review_id    TEXT    NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      issue_id     TEXT    NOT NULL,
      title        TEXT    NOT NULL DEFAULT '',
      presenter    TEXT    NOT NULL DEFAULT '',
      description  TEXT    DEFAULT '',
      demo_url     TEXT    DEFAULT '',
      item_status  TEXT    NOT NULL DEFAULT 'progress',
      tags         TEXT    DEFAULT '[]',
      order_index  INTEGER NOT NULL DEFAULT 0,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS screenshots (
      id            TEXT    PRIMARY KEY,
      item_id       TEXT    NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
      file_path     TEXT    NOT NULL,
      original_name TEXT    NOT NULL,
      mime_type     TEXT    NOT NULL,
      size_bytes    INTEGER NOT NULL,
      order_index   INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qa_entries (
      id           TEXT    PRIMARY KEY,
      review_id    TEXT    NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      item_id      TEXT    NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
      author       TEXT    NOT NULL DEFAULT '',
      author_role  TEXT    DEFAULT '',
      text         TEXT    NOT NULL,
      captured_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_review   ON review_items(review_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_shots_item     ON screenshots(item_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_qa_item        ON qa_entries(item_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, created_at);
  `)

  const hasNotes = (_db.prepare(
    "SELECT COUNT(*) as c FROM pragma_table_info('screenshots') WHERE name='notes'"
  ).get() as { c: number }).c > 0
  if (!hasNotes) {
    _db.exec("ALTER TABLE screenshots ADD COLUMN notes TEXT DEFAULT NULL")
  }

  const hasReviewDate = (_db.prepare(
    "SELECT COUNT(*) as c FROM pragma_table_info('reviews') WHERE name='review_date'"
  ).get() as { c: number }).c > 0
  if (!hasReviewDate) {
    _db.exec("ALTER TABLE reviews ADD COLUMN review_date INTEGER DEFAULT NULL")
  }

  return _db
}

export { SCREENSHOTS_DIR }
