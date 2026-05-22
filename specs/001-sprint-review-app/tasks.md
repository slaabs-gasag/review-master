---
description: "Task list for Sprint Review App implementation"
---

# Tasks: Sprint Review App

**Input**: Design documents from `specs/001-sprint-review-app/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: E2E tests included (required by Constitution Principle III — acceptance gate).
Unit/component tests included for foundational DB logic and shared UI components.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps task to user story (US1, US2, US3)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the app shell, design tokens, and layouts that every user story needs.

- [X] T001 Replace `app/app.vue` content with `<NuxtLayout><NuxtPage/></NuxtLayout>` and remove `NuxtWelcome`
- [X] T002 [P] Create `app/assets/css/laabslab.css` with the full LaabsLab design token set (colors, type scale, spacing, radii, shadows, motion, layout) from the Claude Design prototype — import Space Grotesk / Manrope / JetBrains Mono from Google Fonts
- [X] T003 [P] Create `app/layouts/default.vue` — top nav bar (64px): brand logo + "Review Master" wordmark, mode tabs (Plan `[1]` / Archive `[3]`), settings icon slot; `<slot/>` fills remaining viewport height; global `1`/`3` keyboard shortcuts; add CSS import for `~/assets/css/laabslab.css`
- [X] T004 [P] Create `app/layouts/present.vue` — minimal layout: `height: 100vh; overflow: hidden; background: var(--ink-00)`; no nav bar; `<slot/>`
- [X] T005 Update `nuxt.config.ts` to add `css: ['~/assets/css/laabslab.css']`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: SQLite DB, shared TypeScript types, and reusable UI atoms all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Create `server/types/db.ts` — export TypeScript interfaces: `Review`, `ReviewItem`, `Screenshot`, `QaEntry`, `ReviewItemWithMedia`, `ReviewWithItems` (exact shapes from `specs/001-sprint-review-app/data-model.md`)
- [X] T007 Create `server/utils/db.ts` — export a `getDb()` singleton returning a `better-sqlite3` Database instance; run idempotent `CREATE TABLE IF NOT EXISTS` for all four tables + indexes on first call; DB file at `.data/review-master.sqlite`; ensure `.data/screenshots/` directory exists
- [X] T008 [P] Create `app/components/ui/AvatarGradient.vue` — props: `name: string`, `size?: 'sm' | 'md' | 'lg'`; renders initials over deterministic gradient background (hash `name` into one of 7 gradients from the prototype's `AV_GRADS` array)
- [X] T009 [P] Create `app/components/ui/StatusBadge.vue` — props: `status: 'done' | 'progress' | 'blocked' | 'live'`; renders chip with colored dot using LaabsLab chip + dot CSS classes
- [X] T010 [P] Create `app/components/ui/IssueBadge.vue` — props: `issueId: string`; renders mono-font chip with `chip-issue` style from LaabsLab tokens

**Checkpoint**: DB schema created, types exported, 3 UI atoms usable — user story phases can begin.

---

## Phase 3: User Story 1 — Plan a Sprint Review (Priority: P1) 🎯 MVP

**Goal**: User can create a review, add and edit agenda items with issue ID + presenter + screenshots + URL + status + tags, reorder items by drag, and trigger "Start review".

**Independent Test**: Create a review at `/reviews/new`, add 3 items with mixed media, drag to reorder, confirm all data survives a page refresh (persistent in SQLite), and the "Start review" button navigates to `/present/[id]`.

### Server API — US1

- [X] T011 [P] [US1] Create `server/api/reviews/index.get.ts` — `GET /api/reviews`: return all reviews ordered by `created_at DESC`; deserialize nothing (flat row objects)
- [X] T012 [P] [US1] Create `server/api/reviews/index.post.ts` — `POST /api/reviews`: validate `name` and `sprint` non-empty; insert row with UUID + `created_at = Date.now()`; return 201 with created review
- [X] T013 [US1] Create `server/api/reviews/[id].get.ts` — `GET /api/reviews/[id]`: fetch review; join items ordered by `order_index`; for each item join screenshots ordered by `order_index`; parse `tags` JSON; return `ReviewWithItems`; 404 if not found
- [X] T014 [P] [US1] Create `server/api/reviews/[id].put.ts` — `PUT /api/reviews/[id]`: partial update of `name`, `sprint`, `team`, `description`, `status`; enforce status transition rules (planned→active sets `started_at`, active→completed sets `completed_at` + computes `duration_ms`); reject backward transitions with 409
- [X] T015 [P] [US1] Create `server/api/reviews/[id].delete.ts` — `DELETE /api/reviews/[id]`: delete review (cascade deletes items + qa_entries via SQLite FK); also delete all screenshot files from `.data/screenshots/` by querying screenshots table before deletion; return 204
- [X] T016 [P] [US1] Create `server/api/reviews/[id]/items.post.ts` — `POST /api/reviews/[id]/items`: validate `issue_id` non-empty; reject if review status ≠ `planned` (409); insert item at `max(order_index)+1`; serialize `tags` to JSON; return 201
- [X] T017 [US1] Create `server/api/reviews/[id]/items/reorder.put.ts` — `PUT /api/reviews/[id]/items/reorder`: validate `order` array contains exactly the review's current item IDs (400 if mismatch); update each item's `order_index` in a single transaction; return 200 `{ ok: true }`
- [X] T018 [P] [US1] Create `server/api/items/[id].put.ts` — `PUT /api/items/[id]`: partial update of item fields; validate `item_status` enum; validate `demo_url` prefix; serialize `tags` to JSON; return updated item
- [X] T019 [P] [US1] Create `server/api/items/[id].delete.ts` — `DELETE /api/items/[id]`: delete item; delete its screenshot files from disk; return 204
- [X] T020 [US1] Create `server/api/items/[id]/screenshots.post.ts` — `POST /api/items/[id]/screenshots`: parse multipart form; validate MIME type (png/jpeg/webp) and size (≤10MB); write file to `.data/screenshots/<uuid>.<ext>`; insert screenshot row; return 201 with screenshot metadata (no file path in response)
- [X] T021 [P] [US1] Create `server/api/screenshots/[id].get.ts` — `GET /api/screenshots/[id]`: look up file_path + mime_type from DB; stream file with correct Content-Type + `Cache-Control: private, max-age=86400`; 404 if record or file missing
- [X] T022 [P] [US1] Create `server/api/screenshots/[id].delete.ts` — `DELETE /api/screenshots/[id]`: delete DB row + file from disk; return 204

### Composables — US1

- [X] T023 [US1] Create `app/composables/useReview.ts` — exports `useCurrentReview()`: fetches most-recent planned review via `useFetch('/api/reviews')`, provides `review`, `refresh()`, `updateItem()`, `addItem()`, `deleteItem()`, `reorderItems()`, `startReview()` (calls PUT status→active, then navigates to `/present/[id]`)
- [X] T024 [P] [US1] Create `app/composables/useDragReorder.ts` — exports `useDragReorder(items: Ref<ReviewItem[]>, onReorder: (ids: string[]) => void)`: implements HTML5 drag events (dragstart/dragover/drop/dragend); returns `{ onDragStart, onDragOver, onDrop, draggingId }`

### Components — US1

- [X] T025 [P] [US1] Create `app/components/plan/AgendaRow.vue` — props: `item`, `index`, `selected`, `dragging`; emits: `select`, `dragstart`, `dragover`, `drop`; renders: grip icon, zero-padded index, issue ID chip, title, screenshot + demo + tag meta, avatar + presenter name + role, status badge; selected state via `.on` CSS class
- [X] T026 [US1] Create `app/components/plan/AgendaList.vue` — props: `items`, `selectedId`; emits: `select`, `reorder`; wraps AgendaRow list with `useDragReorder`; "Add item" button at bottom (emits `add`); calls `onReorder` callback which hits reorder API
- [X] T027 [US1] Create `app/components/plan/ItemEditor.vue` — props: `item`; emits: `update`, `uploadScreenshot`, `deleteScreenshot`; fields: issue ID (read-only chip), editable title textarea, presenter name free-text UInput (not a picker — no managed people list), description textarea (markdown hint), screenshot grid with ⌘V paste support + delete, demo URL input with `https://` prefix, status radio pills, tag list with add/remove; auto-saves field changes via `$fetch` on blur/change
- [X] T028 [P] [US1] Create `app/pages/reviews/new.vue` — layout: `default`; form with name + sprint + team inputs; submit calls `POST /api/reviews`, redirects to `/`
- [X] T029 [US1] Create `app/pages/index.vue` — layout: `default`; loads current planned review via `useCurrentReview()`; if none: empty state with "Create your first review" CTA to `/reviews/new`; two-column grid: left = `AgendaList` + plan stats footer (items count, ready count, est. time) + "Start review" button; right = `ItemEditor` for selected item; plan header shows review name, sprint, date + presenter count

**Checkpoint**: User Story 1 fully functional — create review, populate items, reorder, start review navigates to presenter mode URL.

---

## Phase 4: User Story 2 — Execute a Review in Presenter Mode (Priority: P2)

**Goal**: Full-screen slideshow from `/present/[id]` with keyboard navigation (←/→/Space/Esc/Q), per-item Q&A capture, progress pips, and "End review" that marks review complete + redirects to archive.

**Independent Test**: Navigate to `/present/[id]` for a review with 3 items. Verify: all items reachable via keyboard, screenshots display, Q&A entry saved and shown, Esc exits, last item shows "End review" which completes the review and redirects to `/archive`.

### Server API — US2

- [X] T030 [P] [US2] Create `server/api/items/[id]/qa/index.get.ts` — `GET /api/items/[id]/qa`: return Q&A entries for item ordered by `captured_at ASC`
- [X] T031 [P] [US2] Create `server/api/items/[id]/qa/index.post.ts` — `POST /api/items/[id]/qa`: validate `text` non-empty; insert qa_entry with `review_id` derived from item's `review_id`; return 201
- [X] T032 [P] [US2] Create `server/api/qa/[id].delete.ts` — `DELETE /api/qa/[id]`: delete Q&A entry; return 204

### Composables — US2

- [X] T033 [US2] Create `app/composables/useKeyboardNav.ts` — exports `useKeyboardNav(handlers: { onNext, onPrev, onEscape, onQA })`: registers/unregisters `keydown` listener on mount/unmount; handles `ArrowRight`, `Space` (onNext), `ArrowLeft` (onPrev), `Escape` (onEscape), `q`/`Q` (onQA); skips when event target is input/textarea

### Components — US2

- [X] T034 [P] [US2] Create `app/components/presenter/PresenterSlide.vue` — props: `item: ReviewItemWithMedia`, `screenshotIndex?: number`; renders selected screenshot as full-bleed background (via `/api/screenshots/[id]`); if no screenshots, renders styled placeholder with issue ID; demo URL shown as overlay link
- [X] T035 [US2] Create `app/components/presenter/PresenterChrome.vue` — props: `item`, `index`, `total`, `agenda`, `elapsed`, `isArchive`, `qaCount`; emits: `prev`, `next`, `exit`, `toggleQA`, `selectItem`; four-corner overlay: TL = live dot (if not archive) + issue ID + title; TR = progress pips + counter + × close; BL = avatar + presenter name + role; BR = Q&A button + nav ← time →; uses `var(--ink-00)` with backdrop blur
- [X] T036 [P] [US2] Create `app/components/presenter/PresenterPeek.vue` — props: `agenda`, `currentIndex`; emits: `select`; collapsible side panel listing agenda items with zero-padded index, issue ID, live dot on current item, checkmark on past items; click jumps to item
- [X] T037 [US2] Create `app/components/presenter/QaPanel.vue` — props: `open`, `entries`, `isArchive`; emits: `close`, `save`, `delete`; slide-out panel: header with count, scrollable Q&A list (avatar + author + role + time + text), if not archive: input + save button; Esc closes

### Pages — US2

- [X] T038 [US2] Create `app/pages/present/[id].vue` — layout: `present`; load review by ID via `$fetch('/api/reviews/[id]')`; mount `useKeyboardNav`; track `currentIndex` (starts at 0); render `PresenterSlide` + `PresenterChrome` + `PresenterPeek` + `QaPanel`; Q&A loaded per-item via `useFetch`; completion flow: after last item show "End review" button overlay → call `PUT /api/reviews/[id] { status: 'completed' }` → `navigateTo('/archive')`

**Checkpoint**: Presenter mode fully functional — keyboard nav, Q&A capture, review completion.

---

## Phase 5: User Story 3 — Browse and Inspect the Archive (Priority: P3)

**Goal**: `/archive` shows completed reviews as cards with stats strip and team filter; clicking a card opens `/archive/[id]` for read-only inspection; "Re-watch" opens `/archive/[id]/present` (read-only presenter mode).

**Independent Test**: Complete a review (from US2), navigate to `/archive`, verify the review card appears with correct item/shipped/Q&A counts. Click the card, verify items displayed read-only with screenshots and Q&A. Click "Re-watch", verify presenter mode loads in read-only mode (no Q&A input, Esc returns to archive).

### Components — US3

- [X] T039 [P] [US3] Create `app/components/archive/ArchiveStats.vue` — props: `reviews: Review[]`; computes and renders 4 stat cards: sprints archived, items shipped, Q&A captured, unique presenters count; each card has label + large value + trend line
- [X] T040 [P] [US3] Create `app/components/archive/SprintCard.vue` — props: `review: ReviewWithItems`, `featured?: boolean`; renders team color dot + team name + sprint + date; item/shipped/Q&A numbers; avatar stack (up to 4 presenters); duration; "Re-watch →" footer link; `featured` prop adds "latest" cyan chip

### Pages — US3

- [X] T041 [P] [US3] Create `app/pages/archive/index.vue` — layout: `default`; load completed reviews via `useFetch('/api/reviews')` filtered by status; render `ArchiveStats` + team filter pills + responsive grid of `SprintCard`; filter state in `ref`; sorted by `completed_at DESC`
- [X] T042 [US3] Create `app/pages/archive/[id].vue` — layout: `default`; load review via `useFetch('/api/reviews/[id]')`; read-only two-column layout (list left, item detail right — no edit controls, no drag handles); "Re-watch" button → `/archive/[id]/present`; back link → `/archive`; each item shows screenshots grid + Q&A entries below
- [X] T043 [US3] Create `app/pages/archive/[id]/present.vue` — layout: `present`; same structure as `/present/[id]` but: `isArchive=true` passed to all components; no live dot; Q&A panel is read-only (no save input); Esc navigates to `/archive/[id]`; top bar shows "← Back to archive" + sprint name + "read-only" chip

**Checkpoint**: All user stories independently functional. Full plan → present → archive → re-watch flow working.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E test coverage (required by Constitution Principle III), CSS animation details, and UX edge cases.

- [X] T044 [P] Write `test/unit/db.test.ts` — test `getDb()` singleton: verify schema tables exist after init; test basic CRUD for reviews and review_items via direct DB calls; test cascade delete; test order_index uniqueness logic
- [X] T045 [P] Write `test/nuxt/AgendaRow.test.ts` — mount AgendaRow with mock item; assert issue ID chip renders, status badge correct, presenter avatar visible, drag events emit correctly
- [X] T046 [P] Write `test/nuxt/StatusBadge.test.ts` — test all 4 status values render correct CSS class and dot color
- [X] T047 Write `tests/planning.spec.ts` (Playwright e2e) — full US1 flow: navigate to `/`, create review via `/reviews/new`, add 3 items with different statuses, upload screenshot, drag to reorder, verify new order after refresh, click "Start review" and confirm navigation to `/present/[id]`
- [X] T048 [P] Write `tests/presenter.spec.ts` (Playwright e2e) — US2 flow: start from planned review, enter presenter mode, navigate with keyboard (→, ←, Space), open Q&A panel, save a question, navigate to last item, end review, confirm redirect to `/archive`
- [X] T049 [P] Write `tests/archive.spec.ts` (Playwright e2e) — US3 flow: after completing a review, open `/archive`, verify card shown with correct stats, click card for detail view, click "Re-watch", navigate through re-watch in read-only mode, verify Esc returns to archive
- [X] T050 CSS polish — add slide transition animation for presenter mode (cross-fade or slide on item change), live dot animation in chrome, loading skeleton for agenda list, hover states for sprint cards; verify transitions run at 60fps; no layout shift on screenshot load

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundation completion; phases MUST run in priority order (US1 → US2 → US3) because US2 depends on reviews created by US1, and US3 depends on reviews completed by US2
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundation — no dependency on US2 or US3
- **User Story 2 (P2)**: Starts after US1 complete (uses `PUT /api/reviews/[id]` status transition + existing review data)
- **User Story 3 (P3)**: Can start in parallel with US2 (archive page only reads completed reviews; components are independent)

### Within Each Phase

- Server API tasks marked [P] can run in parallel (different files)
- Component tasks marked [P] can run in parallel
- Composable before components that use it
- API routes before pages that call them
- Foundation (T006+T007) before ALL user story work

### Parallel Opportunities

```bash
# Phase 1 — all parallel:
T002, T003, T004 can run simultaneously (different files)

# Phase 2 — partial parallel:
T006 first (types needed by T007)
T007 then T008, T009, T010 in parallel

# Phase 3 — server API parallel batch:
T011, T012, T014, T015, T016, T018, T019, T021, T022 can run simultaneously
T013, T017, T020 must run after T007 is complete (depend on schema)
T023 after T011–T022 complete
T024 independent [P]
T025, T028 independent [P]
T026 after T025
T027 after T008, T009, T010
T029 after T023, T026, T027

# Phase 4 — server parallel batch:
T030, T031, T032 parallel
T033, T034 parallel
T035, T036, T037 parallel
T038 after T033–T037

# Phase 5 — partial parallel:
T039, T040 parallel
T041, T042 parallel (both after T039+T040)
T043 after T038 (reuses presenter components)

# Phase 6 — test files parallel:
T044, T045, T046, T047, T048, T049 parallel
T050 last (needs all pages working)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundation (T006–T010)
3. Complete Phase 3: User Story 1 (T011–T029)
4. **STOP and VALIDATE**: `npm run dev` → create review → add items → verify persistence
5. Planning view is a complete, useful product at this point

### Incremental Delivery

1. Setup + Foundation → app shell running, DB initialized
2. User Story 1 → Planning view complete → can manage review agenda (MVP!)
3. User Story 2 → Presenter mode → can run a live review
4. User Story 3 → Archive → historical record available
5. Polish → E2E tests pass, animations complete

---

## Notes

- `[P]` = different files, no unmet dependencies → safe to parallelize
- Story label maps task to spec.md user story for traceability
- File paths are relative to repo root
- All server routes use `getDb()` from `server/utils/db.ts`
- Screenshots served via `/api/screenshots/[id]` — never from `public/`
- Commit after each phase checkpoint
- Run `npm run test:e2e` before marking US1/US2/US3 complete (Constitution Principle III)
