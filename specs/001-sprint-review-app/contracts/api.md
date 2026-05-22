# API Contract: Sprint Review App

All routes are Nuxt server API routes under `/api/`. All requests and responses use JSON
(except screenshot upload which uses `multipart/form-data` and screenshot serve which returns binary).
No authentication. Error responses always include `{ error: string }`.

---

## Reviews

### `GET /api/reviews`

List all reviews ordered by `created_at` descending.

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "name": "Sprint 47 · Review",
    "sprint": "47",
    "team": "Workstream Studio",
    "description": "",
    "status": "planned",
    "created_at": 1748000000000,
    "started_at": null,
    "completed_at": null,
    "duration_ms": null
  }
]
```

---

### `POST /api/reviews`

Create a new review.

**Request body**:
```json
{
  "name": "Sprint 47 · Review",
  "sprint": "47",
  "team": "Workstream Studio",
  "description": ""
}
```

**Validation**: `name` and `sprint` MUST be non-empty strings.

**Response** `201`: Created review object.

**Errors**: `400` if validation fails.

---

### `GET /api/reviews/[id]`

Get a review with all items and screenshots.

**Response** `200`:
```json
{
  "id": "uuid",
  "name": "Sprint 47 · Review",
  "sprint": "47",
  "team": "Workstream Studio",
  "description": "",
  "status": "planned",
  "created_at": 1748000000000,
  "started_at": null,
  "completed_at": null,
  "duration_ms": null,
  "items": [
    {
      "id": "uuid",
      "review_id": "uuid",
      "issue_id": "WSS-1242",
      "title": "Compose-mode reactions overlay",
      "presenter": "Mira Chen",
      "description": "...",
      "demo_url": "https://wss.lab/preview/r-1242",
      "item_status": "done",
      "tags": ["frontend", "polish"],
      "order_index": 0,
      "created_at": 1748000000000,
      "screenshots": [
        {
          "id": "uuid",
          "item_id": "uuid",
          "file_path": ".data/screenshots/uuid.png",
          "original_name": "screenshot.png",
          "mime_type": "image/png",
          "size_bytes": 204800,
          "order_index": 0,
          "created_at": 1748000000000
        }
      ]
    }
  ]
}
```

**Errors**: `404` if review not found.

---

### `PUT /api/reviews/[id]`

Update review metadata or status. Partial updates supported (only provided fields updated).

**Request body** (all fields optional):
```json
{
  "name": "Sprint 47 · Review",
  "sprint": "47",
  "team": "Workstream Studio",
  "description": "updated notes",
  "status": "active"
}
```

**Status transition rules** (enforced server-side):
- `planned` → `active`: sets `started_at` to current timestamp
- `active` → `completed`: sets `completed_at` to current timestamp, computes `duration_ms`
- Backward transitions are rejected with `409`

**Response** `200`: Updated review object (without items).

**Errors**: `400` validation, `404` not found, `409` invalid status transition.

---

### `DELETE /api/reviews/[id]`

Delete a review and all associated items, screenshots (files + DB rows), and Q&A entries
(cascade via SQLite `ON DELETE CASCADE` + server-side file cleanup).

**Response** `204`: No content.

**Errors**: `404` if not found.

---

## Review Items

### `POST /api/reviews/[reviewId]/items`

Add a new item to a review. Only allowed when review status is `planned`.

**Request body**:
```json
{
  "issue_id": "WSS-1242",
  "title": "Compose-mode reactions overlay",
  "presenter": "Mira Chen",
  "description": "",
  "demo_url": "",
  "item_status": "progress",
  "tags": []
}
```

**Validation**: `issue_id` MUST be non-empty. `item_status` MUST be valid enum value.
`demo_url` when non-empty MUST start with `http://` or `https://`.

**Behavior**: New item is appended at the end (max `order_index` + 1).

**Response** `201`: Created item object (without screenshots array).

**Errors**: `400` validation, `404` review not found, `409` review not in `planned` status.

---

### `PUT /api/items/[id]`

Update an item's fields. Partial updates supported.

**Request body** (all fields optional):
```json
{
  "issue_id": "WSS-1242",
  "title": "Updated title",
  "presenter": "Theo Park",
  "description": "markdown notes",
  "demo_url": "https://example.com",
  "item_status": "done",
  "tags": ["frontend", "api"]
}
```

**Response** `200`: Updated item object (without screenshots).

**Errors**: `400` validation, `404` not found.

---

### `PUT /api/reviews/[reviewId]/items/reorder`

Update the `order_index` for all items in a review atomically.

**Request body**:
```json
{
  "order": ["uuid1", "uuid2", "uuid3"]
}
```

**Validation**: `order` MUST contain exactly the same IDs as the review's current items.

**Response** `200`: `{ "ok": true }`

**Errors**: `400` if IDs don't match, `404` review not found.

---

### `DELETE /api/items/[id]`

Delete an item and its screenshots (files + DB rows).

**Response** `204`: No content.

**Errors**: `404` not found.

---

## Screenshots

### `POST /api/items/[itemId]/screenshots`

Upload a screenshot. `Content-Type: multipart/form-data`.

**Form fields**:
- `file` (required): Image file

**Validation**: MIME type MUST be `image/png`, `image/jpeg`, or `image/webp`.
Size MUST be ≤ 10,485,760 bytes (10 MB).

**Response** `201`:
```json
{
  "id": "uuid",
  "item_id": "uuid",
  "original_name": "screenshot.png",
  "mime_type": "image/png",
  "size_bytes": 204800,
  "order_index": 2,
  "created_at": 1748000000000
}
```

**Errors**: `400` invalid file type/size, `404` item not found.

---

### `GET /api/screenshots/[id]`

Serve a screenshot file binary.

**Response** `200`: Binary image content with correct `Content-Type` header.

**Cache**: `Cache-Control: private, max-age=86400` (safe since IDs are immutable UUIDs).

**Errors**: `404` if screenshot record or file not found.

---

### `DELETE /api/screenshots/[id]`

Delete a screenshot (DB record + file from disk).

**Response** `204`: No content.

**Errors**: `404` if not found.

---

## Q&A Entries

### `GET /api/items/[itemId]/qa`

Get all Q&A entries for an item, ordered by `captured_at` ascending.

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "review_id": "uuid",
    "item_id": "uuid",
    "author": "S. Marks",
    "author_role": "PM",
    "text": "Does this work when a user has > 100 reactions queued?",
    "captured_at": 1748000000000
  }
]
```

---

### `POST /api/items/[itemId]/qa`

Capture a Q&A entry during presenter mode.

**Request body**:
```json
{
  "author": "S. Marks",
  "author_role": "PM",
  "text": "Does this work when a user has > 100 reactions queued?"
}
```

**Validation**: `text` MUST be non-empty.

**Response** `201`: Created Q&A entry.

**Errors**: `400` validation, `404` item not found.

---

### `DELETE /api/qa/[id]`

Delete a Q&A entry.

**Response** `204`: No content.

**Errors**: `404` if not found.
