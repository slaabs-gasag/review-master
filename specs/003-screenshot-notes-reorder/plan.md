# Implementation Plan: Screenshot Notes, Reorder, and Remove Items

**Branch**: `003-screenshot-notes-reorder` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

## Summary

Three planning-page enhancements:
1. Remove individual items from a review (UI for already-existing API + composable)
2. Add free-text notes to screenshots (new `notes` column + update API)
3. Drag-to-reorder screenshots within an item (new reorder API + UI)

All changes are local-only, use existing stack (Nuxt 4, better-sqlite3, @nuxt/ui, useDragReorder), and require no new dependencies.

## Technical Context

**Language/Version**: TypeScript / Node.js (Nuxt 4)

**Primary Dependencies**: `@nuxt/ui` (TailwindCSS v4), `better-sqlite3` (SQLite), `@nuxt/content`

**Storage**: SQLite at `.data/review-master.sqlite`. Screenshots stored as files under `.data/screenshots/`.

**Testing**: Vitest (unit + Nuxt component), Playwright (e2e, Chromium only)

**Target Platform**: Local machine, dev server (`npm run dev`)

**Project Type**: Local desktop-class web app (presentation tool)

**Performance Goals**: Instant interactions during presentation; no blocking loaders on critical path

**Constraints**: Local-only, no auth, no network dependencies at runtime

**Scale/Scope**: Single-user, single machine; no concurrency concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First Execution | ✅ Pass | No new network dependencies; all changes are local SQLite + filesystem |
| II. Official Libraries Preferred | ✅ Pass | No new dependencies. Reuses `useDragReorder` composable already in project |
| III. Flawless Presentation Stability | ✅ Pass | All three sub-features gated by e2e tests before merge |
| IV. Quick Execution | ✅ Pass | No blocking operations on presentation path; reorder/notes are planning-time only |
| V. Minimal Scope | ✅ Pass | All three features directly serve sprint review planning; no speculative scope |

**Post-design re-check**: No violations introduced by design artifacts below.

## Project Structure

### Documentation (this feature)

```text
specs/003-screenshot-notes-reorder/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (affected paths)

```text
server/
├── db.ts                            ← ADD notes column migration (ALTER TABLE)
├── types/db.ts                      ← ADD notes field to Screenshot interface
├── api/
│   ├── items/[id].delete.ts         ← existing (no change needed)
│   ├── items/[id]/screenshots/
│   │   └── reorder.put.ts           ← NEW: reorder screenshots for an item
│   └── screenshots/
│       ├── [id].get.ts              ← existing (no change needed)
│       ├── [id].delete.ts           ← existing (no change needed)
│       └── [id].put.ts              ← NEW: update screenshot notes

app/
├── composables/
│   └── useReview.ts                 ← ADD updateScreenshot(), reorderScreenshots()
├── components/
│   └── plan/
│       ├── ItemEditor.vue           ← ADD notes field per screenshot, drag reorder
│       └── AgendaRow.vue            ← ADD delete item button (or handle in AgendaList)
├── pages/
│   └── index.vue                    ← WIRE delete item action, reorder screenshots
└── components/
    └── presenter/
        └── PresenterSlide.vue       ← SHOW screenshot notes in presenter view

test/unit/                           ← unit tests for new API handlers (optional)
tests/                               ← Playwright e2e: delete item, notes, reorder
```
