# Tasks: Screenshot Notes, Reorder, and Remove Items

**Input**: Design documents from `specs/003-screenshot-notes-reorder/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup

No new project structure needed — existing Nuxt 4 project with all required infrastructure in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB migration and type update required by US2 (screenshot notes). Must complete before US2 and US3 start.

**⚠️ CRITICAL**: US2 and US3 depend on this phase. US1 can start immediately without it.

- [ ] T001 Add `notes TEXT DEFAULT NULL` column migration to `server/db.ts` via `pragma_table_info` check (run-once at startup)
- [ ] T002 [P] Add `notes: string | null` field to `Screenshot` interface in `server/types/db.ts`

**Checkpoint**: DB column + TS type ready — screenshot notes work can begin

---

## Phase 3: User Story 1 — Remove Item from Review (Priority: P1) 🎯 MVP

**Goal**: Presenter can remove an individual item from the agenda during planning.

**Independent Test**: On the planning page, select any item, click "Remove item", confirm — item disappears from list immediately. Works with single item (empties list).

### Implementation for User Story 1

- [ ] T003 [US1] Add `deleteItem: []` emit + "Remove item" button with inline two-step confirmation state (click → "Confirm?" → click) to `app/components/plan/ItemEditor.vue`
- [ ] T004 [US1] Handle `deleteItem` emit in `app/pages/index.vue`: call `deleteItem(selectedId)`, then clear `selectedItemId`

### E2E Test for User Story 1

- [ ] T005 [US1] Write Playwright e2e test in `tests/` covering: add item → remove item → verify list empty; add two items → remove one → verify other remains

**Checkpoint**: US1 complete — item removal fully functional and e2e-tested

---

## Phase 4: User Story 2 — Screenshot Notes (Priority: P2)

**Goal**: Presenter can add text notes to each screenshot; notes appear in presenter view.

**Independent Test**: Upload a screenshot, type notes, blur to save, reload page — note persists. Open presenter view on that item's screenshot slide — note is visible.

**Requires**: Phase 2 complete (T001, T002)

### Implementation for User Story 2

- [ ] T006 [P] [US2] Create `server/api/screenshots/[id].put.ts`: accept `{ notes: string | null }`, validate screenshot exists, update DB, return updated screenshot
- [ ] T007 [US2] Add `updateScreenshot(id: string, payload: { notes: string | null })` to `app/composables/useReview.ts` (calls PUT `/api/screenshots/${id}`, then refresh)
- [ ] T008 [US2] Add `updateScreenshot: [id: string, notes: string | null]` emit to `app/components/plan/ItemEditor.vue`; render a notes textarea below each screenshot thumbnail in the screenshots grid; emit on blur
- [ ] T009 [US2] Handle `updateScreenshot` emit in `app/pages/index.vue`: call `updateScreenshot(id, notes)` from composable
- [ ] T010 [US2] Show screenshot `notes` in `app/components/presenter/PresenterSlide.vue` on the screenshot slide (below or alongside the image, only when notes is non-empty)

### E2E Test for User Story 2

- [ ] T011 [US2] Write Playwright e2e test in `tests/` covering: upload screenshot → add notes → reload → verify note persists; verify note visible in presenter view

**Checkpoint**: US2 complete — screenshot notes functional end-to-end

---

## Phase 5: User Story 3 — Reorder Screenshots (Priority: P3)

**Goal**: Presenter can drag screenshots into a different order; order persists and is reflected in presenter view.

**Independent Test**: Upload 2+ screenshots to an item, drag one to swap positions, reload page — new order persists. Open presenter view — screenshots appear in the new order.

**Requires**: Phase 2 complete (T001, T002)

### Implementation for User Story 3

- [ ] T012 [P] [US3] Create `server/api/items/[id]/screenshots/reorder.put.ts`: accept `{ order: string[] }`, validate all IDs belong to item and array length matches, update `order_index` for each screenshot atomically
- [ ] T013 [US3] Add `reorderScreenshots(itemId: string, order: string[])` to `app/composables/useReview.ts` (calls PUT `/api/items/${itemId}/screenshots/reorder`, then refresh)
- [ ] T014 [US3] Integrate `useDragReorder` for the screenshots array in `app/components/plan/ItemEditor.vue`; add drag handles to each screenshot thumbnail; add `reorderScreenshots: [ids: string[]]` emit; fire on drop
- [ ] T015 [US3] Handle `reorderScreenshots` emit in `app/pages/index.vue`: call `reorderScreenshots(selectedItem.id, ids)` from composable

### E2E Test for User Story 3

- [ ] T016 [US3] Write Playwright e2e test in `tests/` covering: upload 2 screenshots → drag to swap → reload → verify persisted order; verify presenter view shows correct order

**Checkpoint**: US3 complete — all three sub-features functional and e2e-tested

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 Run full test suite (`npm run test` + `npm run test:e2e`) and fix any regressions from changes to ItemEditor, index.vue, or PresenterSlide

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No story dependencies — start immediately in parallel with US1
- **US1 (Phase 3)**: No foundational dependency — can start immediately
- **US2 (Phase 4)**: Depends on T001 + T002 (notes column + type)
- **US3 (Phase 5)**: Depends on T001 + T002 (order_index type consistent); T012–T015 independent of US2
- **Polish (Phase 6)**: Depends on all desired stories complete

### User Story Dependencies

- **US1**: Independent — no dependency on Phase 2 or other stories
- **US2**: Requires Phase 2 (T001, T002). Independent of US1 and US3.
- **US3**: Requires Phase 2 (T001, T002). Independent of US1 and US2.

### Within Each Story

- API endpoint before composable method
- Composable method before UI wiring
- UI component changes before page-level wiring
- Implementation before e2e test writing (no TDD requested)

### Parallel Opportunities

- T001 and T002 (foundational) can run in parallel
- T003–T004 (US1) can run in parallel with T001–T002
- T006 (US2 API) and T012 (US3 API) can run in parallel after Phase 2
- T008 (US2 ItemEditor) and T014 (US3 ItemEditor) must be sequential — same file

---

## Parallel Example: US2 + US3 Server Side

```bash
# These two API endpoints are in different files — run in parallel:
Task T006: "Create server/api/screenshots/[id].put.ts"
Task T012: "Create server/api/items/[id]/screenshots/reorder.put.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: US1 (T003–T005) — no foundational blocker
2. **STOP and VALIDATE**: Item removal works, e2e passes
3. Demo to stakeholders if needed

### Incremental Delivery

1. Phase 2 (T001–T002) → Foundation for notes/reorder
2. US1 (T003–T005) → Item removal live
3. US2 (T006–T011) → Screenshot notes live
4. US3 (T012–T016) → Screenshot reorder live
5. Phase 6 (T017) → Full test suite green

---

## Notes

- [P] = different files, safe to parallelize
- US1 has zero blockers — implement first for immediate value
- T008 and T014 both modify `ItemEditor.vue` — sequence them (US2 first, US3 second, or one combined pass)
- Commit after each checkpoint (T005, T011, T016, T017)
