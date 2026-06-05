# Research: Screenshot Notes, Reorder, and Remove Items

## No external unknowns

All technology is already established in the project. No new libraries, services, or patterns are introduced. This document records the internal codebase research that informs design decisions.

---

## Decision 1: DB migration strategy for `notes` column

**Decision**: Use runtime `ALTER TABLE IF NOT EXISTS` via a conditional check in `getDb()`.

**Rationale**: The project uses `CREATE TABLE IF NOT EXISTS` in `getDb()` (server/db.ts), meaning schema setup runs on every cold start. SQLite supports `ALTER TABLE screenshots ADD COLUMN notes TEXT DEFAULT NULL`, but running it unconditionally on every startup causes an error if the column already exists. The safe pattern is:

```sql
-- Safe migration: add column only if it doesn't exist yet
SELECT COUNT(*) FROM pragma_table_info('screenshots') WHERE name='notes'
-- If 0: ALTER TABLE screenshots ADD COLUMN notes TEXT DEFAULT NULL
```

In `better-sqlite3` this is done as:

```typescript
const hasNotes = (db.prepare(
  "SELECT COUNT(*) as c FROM pragma_table_info('screenshots') WHERE name='notes'"
).get() as { c: number }).c > 0

if (!hasNotes) {
  db.exec("ALTER TABLE screenshots ADD COLUMN notes TEXT DEFAULT NULL")
}
```

**Alternatives considered**:
- Formal migration files (e.g., migrate-db.ts): Overkill for a single-column add on a local-only app with no versioning requirement.
- Dropping and recreating table: Would destroy existing data; rejected.

---

## Decision 2: Screenshot reorder API design

**Decision**: `PUT /api/items/[id]/screenshots/reorder` accepting `{ order: string[] }` — matching the existing pattern for item reordering at `PUT /api/reviews/[id]/items/reorder`.

**Rationale**: The project already has `server/api/reviews/[id]/items/reorder.put.ts`. That endpoint accepts `{ order: string[] }` (array of IDs in desired order) and updates `order_index` for each. The screenshot reorder endpoint mirrors this exactly:
- Route: `server/api/items/[id]/screenshots/reorder.put.ts` (nested under item, consistent with `items/[id]/screenshots.post.ts`)
- Body: `{ order: string[] }` — array of screenshot IDs in new order
- Validates all IDs belong to the item before writing

**Alternatives considered**:
- PATCH individual screenshots with new `order_index`: More requests, more UI complexity; rejected.
- PUT `/api/screenshots/reorder`: Not scoped to an item; harder to validate ownership; rejected.

---

## Decision 3: Screenshot update API for notes

**Decision**: New `PUT /api/screenshots/[id]` endpoint. Only `notes` field supported for now.

**Rationale**: Screenshots currently have no update endpoint (only GET, POST for create, DELETE). Notes are the only mutable field planned, so a minimal PUT that accepts `{ notes: string | null }` is sufficient. Mirrors the pattern of `items/[id].put.ts`.

**Alternatives considered**:
- Reuse existing `PUT /api/items/[id]` to embed notes: Notes are per-screenshot, not per-item; rejected.
- Inline notes save with a debounce to the existing screenshot POST: POST is for creation only; bad REST semantics; rejected.

---

## Decision 4: Remove item UI placement

**Decision**: Delete button in `ItemEditor.vue` (right panel), not in `AgendaRow.vue`.

**Rationale**: 
- `AgendaRow` is a compact list row — adding destructive actions here risks accidental deletion.
- `ItemEditor` is already the detail/edit panel for the selected item. A "Remove item" button at the bottom of the editor, with a confirmation modal, is the natural home.
- The composable already has `deleteItem(id)`. The API (`DELETE /api/items/[id]`) already exists. Only the UI is missing.
- A lightweight inline confirmation (e.g., "Remove item?" with Cancel/Confirm) is sufficient — a full modal is not needed since this is a planning tool, not a destructive production action.

**Alternatives considered**:
- Button in `AgendaRow` on hover: Proximity to the row is convenient but accidental drag+click could trigger; rejected for P1.
- Separate modal component (like `DeleteReviewModal`): Overkill for item-level deletion; rejected.

---

## Decision 5: Screenshot drag reorder in ItemEditor

**Decision**: Reuse `useDragReorder` composable already in `app/composables/useDragReorder.ts`.

**Rationale**: The composable provides drag-and-drop reordering for an array of items. `AgendaList` already uses it for item reordering. The same composable can be applied to the screenshots array in `ItemEditor`. The emit pattern (`reorderScreenshots: [ids: string[]]`) mirrors `reorderItems` from `AgendaList`.

**Alternatives considered**:
- Third-party drag library (vue-draggable, sortablejs): Not needed — existing composable already solves the problem; violates Constitution Principle II.
- Manual mouse event handling: Reinventing the composable; rejected.
