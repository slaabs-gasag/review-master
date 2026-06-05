# Data Model: Screenshot Notes, Reorder, and Remove Items

## Changed Entities

### Screenshot (modified)

**Change**: Add `notes` field (nullable text).

| Field         | Type     | Nullable | Default | Notes                              |
|---------------|----------|----------|---------|------------------------------------|
| id            | TEXT PK  | No       | —       | UUID, no change                    |
| item_id       | TEXT FK  | No       | —       | → review_items.id, no change       |
| file_path     | TEXT     | No       | —       | Local filesystem path, no change   |
| original_name | TEXT     | No       | —       | Upload filename, no change         |
| mime_type     | TEXT     | No       | —       | image/png, image/jpeg, image/webp  |
| size_bytes    | INTEGER  | No       | —       | No change                          |
| order_index   | INTEGER  | No       | 0       | User-controlled; now actively written via reorder API |
| **notes**     | **TEXT** | **Yes**  | **NULL**| **NEW: presenter talking points**  |
| created_at    | INTEGER  | No       | —       | Unix ms, no change                 |

**Migration**: `ALTER TABLE screenshots ADD COLUMN notes TEXT DEFAULT NULL` (run once via pragma check in `getDb()`).

**TypeScript interface update** (`server/types/db.ts`):

```typescript
export interface Screenshot {
  id: string
  item_id: string
  file_path: string
  original_name: string
  mime_type: string
  size_bytes: number
  order_index: number
  notes: string | null   // NEW
  created_at: number
}
```

---

## New API Contracts

### PUT /api/screenshots/[id]

Updates mutable fields of a screenshot. Currently: `notes` only.

**Request body**:
```json
{ "notes": "string or null" }
```

**Response** (200): Updated screenshot object (all fields including `notes`).

**Errors**: 404 if screenshot not found.

---

### PUT /api/items/[id]/screenshots/reorder

Reorders screenshots for a given item. Mirrors `PUT /api/reviews/[id]/items/reorder`.

**Request body**:
```json
{ "order": ["screenshot-id-1", "screenshot-id-2", "screenshot-id-3"] }
```

**Validation**:
- All IDs must exist and belong to the specified item.
- Array length must equal the current screenshot count for that item.

**Response** (200): `{ "ok": true }`

**Errors**: 400 if IDs don't match item's screenshots; 404 if item not found.

---

## No New Entities

Item removal uses the existing `DELETE /api/items/[id]` endpoint. No schema changes needed.

## State Transitions

No new review or item state transitions. All changes operate within existing statuses.

### Screenshot order_index updates

`order_index` is updated atomically across all screenshots for an item in the reorder endpoint. Values are set to 0, 1, 2, ... based on the order array position.
