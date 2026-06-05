# Data Model: Remove Archived Reviews

**Phase 1 output**

---

## Affected Entities

### Review (deletion target)

No schema changes. The existing `reviews` table is deleted by the server via the existing
`DELETE /api/reviews/:id` endpoint, which already handles cascade deletion.

**Deletion cascade** (handled server-side in `server/api/reviews/[id].delete.ts`):
- `reviews` row deleted by ID
- `review_items` rows cascade-deleted (FK `review_id`)
- `item_screenshots` rows cascade-deleted (FK `item_id`)
- Screenshot files on disk deleted via `unlinkSync`
- QA entries implicitly cascade via `review_items` FK

No new tables, columns, or migrations required.

---

## Client-Side State

| State | Location | Change |
|-------|----------|--------|
| `completed` (AsyncData) | `archive/index.vue` | Filter out deleted review id after successful DELETE |
| Review detail | `archive/[id]/index.vue` | Navigate to `/archive` after DELETE |

---

## API Surface (existing — no changes)

| Method | Path | Used for |
|--------|------|----------|
| `DELETE` | `/api/reviews/:id` | Permanently delete a review |

No new server routes needed.
