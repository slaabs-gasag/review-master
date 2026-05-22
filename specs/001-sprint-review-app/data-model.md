# Data Model: Sprint Review App

**Phase 1 output** — entities, fields, relationships, validation rules, state transitions

---

## Entities Overview

```
Review ──< ReviewItem ──< Screenshot
   │            │
   └──< QaEntry ──┘ (item_id + review_id)
```

---

## Table: `reviews`

Represents one sprint review event (planned or completed).

| Column         | Type    | Constraints               | Notes                              |
|----------------|---------|---------------------------|------------------------------------|
| `id`           | TEXT    | PK                        | UUID v4                            |
| `name`         | TEXT    | NOT NULL                  | e.g. "Sprint 47 · Review"          |
| `sprint`       | TEXT    | NOT NULL                  | e.g. "47" or "Sprint 47"           |
| `team`         | TEXT    | NOT NULL DEFAULT ''       | Free-text team name                |
| `description`  | TEXT    | DEFAULT ''                | Optional notes about the review    |
| `status`       | TEXT    | NOT NULL DEFAULT 'planned'| `planned` \| `active` \| `completed` |
| `created_at`   | INTEGER | NOT NULL                  | Unix ms timestamp                  |
| `started_at`   | INTEGER | NULL                      | When presenter mode was launched   |
| `completed_at` | INTEGER | NULL                      | When review was marked done        |
| `duration_ms`  | INTEGER | NULL                      | Elapsed time in ms (set on complete)|

**Status transitions**:
```
planned ──→ active ──→ completed
(on "Start review")   (on "End review")
```

**Validation**:
- `name` MUST NOT be empty
- `sprint` MUST NOT be empty
- `status` MUST be one of: `planned`, `active`, `completed`
- `completed_at` MUST only be set when `status = completed`

---

## Table: `review_items`

Represents a single agenda item within a review.

| Column        | Type    | Constraints                  | Notes                              |
|---------------|---------|------------------------------|------------------------------------|
| `id`          | TEXT    | PK                           | UUID v4                            |
| `review_id`   | TEXT    | FK → reviews.id, NOT NULL    | Owning review                      |
| `issue_id`    | TEXT    | NOT NULL                     | e.g. "WSS-1242" or "VISIO-323"     |
| `title`       | TEXT    | NOT NULL DEFAULT ''          | Short description of the item      |
| `presenter`   | TEXT    | NOT NULL DEFAULT ''          | Full name of presenter             |
| `description` | TEXT    | DEFAULT ''                   | Markdown-formatted notes           |
| `demo_url`    | TEXT    | DEFAULT ''                   | Live demo URL (full URL)           |
| `item_status` | TEXT    | NOT NULL DEFAULT 'progress'  | `done` \| `progress` \| `blocked`  |
| `tags`        | TEXT    | DEFAULT '[]'                 | JSON array of tag strings          |
| `order_index` | INTEGER | NOT NULL DEFAULT 0           | Sort order within the review       |
| `created_at`  | INTEGER | NOT NULL                     | Unix ms timestamp                  |

**Validation**:
- `issue_id` MUST NOT be empty
- `item_status` MUST be one of: `done`, `progress`, `blocked`
- `tags` MUST be valid JSON array of strings (validated on write)
- `demo_url` when not empty MUST start with `http://` or `https://`
- `order_index` MUST be >= 0 and unique within a review (enforced by app logic)

---

## Table: `screenshots`

Represents an image file attached to a review item.

| Column          | Type    | Constraints               | Notes                              |
|-----------------|---------|---------------------------|------------------------------------|
| `id`            | TEXT    | PK                        | UUID v4 (also used as filename)    |
| `item_id`       | TEXT    | FK → review_items.id, NOT NULL | Owning item                   |
| `file_path`     | TEXT    | NOT NULL                  | Absolute path: `.data/screenshots/<id>.<ext>` |
| `original_name` | TEXT    | NOT NULL                  | Original filename from upload      |
| `mime_type`     | TEXT    | NOT NULL                  | `image/png` \| `image/jpeg` \| `image/webp` |
| `size_bytes`    | INTEGER | NOT NULL                  | File size; MUST be ≤ 10,485,760 (10 MB) |
| `order_index`   | INTEGER | NOT NULL DEFAULT 0        | Display order within item          |
| `created_at`    | INTEGER | NOT NULL                  | Unix ms timestamp                  |

**Validation**:
- `mime_type` MUST be one of: `image/png`, `image/jpeg`, `image/webp`
- `size_bytes` MUST be ≤ 10,485,760

---

## Table: `qa_entries`

Q&A questions captured during presenter mode (per item).

| Column       | Type    | Constraints                  | Notes                          |
|--------------|---------|------------------------------|--------------------------------|
| `id`         | TEXT    | PK                           | UUID v4                        |
| `review_id`  | TEXT    | FK → reviews.id, NOT NULL    | Owning review                  |
| `item_id`    | TEXT    | FK → review_items.id, NOT NULL | Item being presented          |
| `author`     | TEXT    | NOT NULL DEFAULT ''          | Name of person who asked       |
| `author_role`| TEXT    | DEFAULT ''                   | Role/title of questioner       |
| `text`       | TEXT    | NOT NULL                     | The question text              |
| `captured_at`| INTEGER | NOT NULL                     | Unix ms timestamp              |

**Validation**:
- `text` MUST NOT be empty

---

## Database Initialization

Schema is created idempotently at server startup via `server/utils/db.ts`.
All tables use `CREATE TABLE IF NOT EXISTS`. No migrations framework needed for v1.

```sql
-- reviews
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

-- review_items
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

-- screenshots
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

-- qa_entries
CREATE TABLE IF NOT EXISTS qa_entries (
  id           TEXT    PRIMARY KEY,
  review_id    TEXT    NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  item_id      TEXT    NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
  author       TEXT    NOT NULL DEFAULT '',
  author_role  TEXT    DEFAULT '',
  text         TEXT    NOT NULL,
  captured_at  INTEGER NOT NULL
);

-- indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_items_review    ON review_items(review_id, order_index);
CREATE INDEX IF NOT EXISTS idx_shots_item      ON screenshots(item_id, order_index);
CREATE INDEX IF NOT EXISTS idx_qa_item         ON qa_entries(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status  ON reviews(status, created_at);
```

---

## Type Definitions (TypeScript)

These interfaces are defined in `server/types/db.ts` and reused by API route handlers.

```typescript
export interface Review {
  id: string
  name: string
  sprint: string
  team: string
  description: string
  status: 'planned' | 'active' | 'completed'
  created_at: number
  started_at: number | null
  completed_at: number | null
  duration_ms: number | null
}

export interface ReviewItem {
  id: string
  review_id: string
  issue_id: string
  title: string
  presenter: string
  description: string
  demo_url: string
  item_status: 'done' | 'progress' | 'blocked'
  tags: string[]     // deserialized from JSON on read
  order_index: number
  created_at: number
}

export interface Screenshot {
  id: string
  item_id: string
  file_path: string
  original_name: string
  mime_type: string
  size_bytes: number
  order_index: number
  created_at: number
}

export interface QaEntry {
  id: string
  review_id: string
  item_id: string
  author: string
  author_role: string
  text: string
  captured_at: number
}

// API response shape — ReviewItem with nested screenshots
export interface ReviewItemWithMedia extends ReviewItem {
  screenshots: Screenshot[]
}

// API response shape — Review with nested items + media
export interface ReviewWithItems extends Review {
  items: ReviewItemWithMedia[]
}
```
