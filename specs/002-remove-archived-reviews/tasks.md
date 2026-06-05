# Tasks: Remove Archived Reviews

**Input**: Design documents from `specs/002-remove-archived-reviews/`

**Branch**: `002-remove-archived-reviews`

**Format**: `[ID] [P?] [Story?] Description with file path`
- **[P]**: Parallelizable (different files, no cross-task dependencies)
- **[Story]**: User story label (US1, US2)

---

## Phase 1: Setup

**Purpose**: No project initialization needed — `DELETE /api/reviews/:id` exists, `@nuxt/ui` is installed, no new dependencies required.

- [x] T001 Verify `DELETE /api/reviews/:id` returns 204 on a real review ID (`server/api/reviews/[id].delete.ts`)

**Checkpoint**: API confirmed — implementation can begin

---

## Phase 2: User Story 1 - Delete from Archive List (Priority: P1) 🎯 MVP

**Goal**: Users can delete a completed review directly from the `/archive` grid, with a confirmation modal, without accidentally navigating to the detail page.

**Independent Test**: Navigate to `/archive` with at least one completed review → activate delete on a card → cancel → card still present. Activate again → confirm → card disappears, archive list updates without reload.

### Implementation

- [x] T002 [US1] Add `deleteTarget`, `deleteOpen`, `deleteError`, `deleteLoading` reactive state and `openDeleteModal`/`confirmDelete` functions to `app/pages/archive/index.vue`
- [x] T003 [P] [US1] Wrap each `NuxtLink`+`SprintCard` in a relative-positioned `.archive-card-wrap` container and add an absolutely-positioned `.archive-delete-btn` trigger button with `@click.stop` in `app/pages/archive/index.vue`
- [x] T004 [US1] Add `UModal` confirmation dialog (title, description, Cancel + Delete buttons, inline error display) outside the grid loop in `app/pages/archive/index.vue`
- [x] T005 [US1] Implement `confirmDelete`: call `$fetch DELETE /api/reviews/:id`, filter deleted id from `completed.value` on success, show error inline on failure, in `app/pages/archive/index.vue`
- [x] T006 [US1] Add `.archive-card-wrap` and `.archive-delete-btn` CSS (subtle, hover-reveal) to `app/assets/css/laabslab.css`

**Checkpoint**: US1 fully functional — delete from list works with confirmation and optimistic UI update

---

## Phase 3: User Story 2 - Delete from Archive Detail (Priority: P2)

**Goal**: Users on an archive detail page (`/archive/[id]`) can delete the review without returning to the list, and are redirected to `/archive` on success.

**Independent Test**: Navigate to `/archive/[id]` → click Delete → modal appears → cancel → still on detail page. Click Delete → confirm → redirected to `/archive`, review no longer listed.

### Implementation

- [x] T007 [P] [US2] Add `deleteOpen`, `deleteError`, `deleteLoading` reactive state to `app/pages/archive/[id]/index.vue`
- [x] T008 [US2] Add "Delete" button to `plan-head-actions` div in `app/pages/archive/[id]/index.vue`
- [x] T009 [US2] Add `UModal` confirmation dialog (same pattern as US1) to `app/pages/archive/[id]/index.vue`
- [x] T010 [US2] Implement `confirmDelete`: call `$fetch DELETE /api/reviews/:id`, `navigateTo('/archive')` on success, show error inline on failure, in `app/pages/archive/[id]/index.vue`

**Checkpoint**: US2 complete — delete from detail page works independently of US1

---

## Phase 4: E2E Tests & Polish

**Purpose**: Playwright coverage for both user stories; visual polish pass.

- [x] T011 [P] Write Playwright e2e test: delete from archive list (create review → complete → archive → delete → verify gone) in `tests/archive-delete.spec.ts`
- [x] T012 [P] Write Playwright e2e test: cancel delete from archive list (verify card survives) in `tests/archive-delete.spec.ts`
- [x] T013 [P] Write Playwright e2e test: delete from archive detail page (verify redirect to `/archive`) in `tests/archive-delete.spec.ts`
- [x] T014 Run archive-delete e2e tests — 5 passed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 checkpoint
- **Phase 3 (US2)**: Can start after Phase 1; independent of Phase 2
- **Phase 4 (Polish)**: Depends on Phase 2 + Phase 3 completion

### User Story Dependencies

- **US1** and **US2** are fully independent (different files, different pages)
- Both can be implemented in parallel after Phase 1

### Parallel Opportunities

- T003, T004, T005, T006 within US1 are sequential (same file, dependent state)
- T007, T008, T009, T010 within US2 are sequential (same file, dependent state)
- US1 (T002–T006) and US2 (T007–T010) can run fully in parallel
- T011, T012, T013 (e2e tests) can be written in parallel

---

## Parallel Example: US1 + US2 simultaneously

```bash
# After T001 (API check), both stories can proceed in parallel:

Stream A (US1 — archive/index.vue):
  T002 → T003 → T004 → T005 → T006

Stream B (US2 — archive/[id]/index.vue):
  T007 → T008 → T009 → T010

# After both streams complete:
Stream C (e2e tests):
  T011, T012, T013 in parallel → T014
```

---

## Implementation Strategy

### MVP (US1 Only — 5 tasks)

1. Complete T001 (verify API)
2. Complete T002–T006 (archive list delete)
3. **STOP and VALIDATE**: Open `/archive` in browser, test delete flow manually
4. Ship US1 if validated

### Full Delivery

1. T001 → T002–T006 (US1) in parallel with T007–T010 (US2)
2. T011–T014 (e2e + full test run)
3. Merge to `main`

---

## Notes

- No server-side changes — `DELETE /api/reviews/:id` is used as-is
- `UModal` from `@nuxt/ui` is auto-imported — no imports needed
- `SprintCard` stays purely presentational — no modifications
- Optimistic removal (filter client state) preferred over re-fetch for snappy UX
- Delete button should be visually subtle (hover-reveal) to avoid distraction in presentations
