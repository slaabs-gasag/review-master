# Research: Sprint Review App

**Phase 0 output** — all technical unknowns resolved

---

## Decision: SQLite Access Strategy

**Decision**: Server-side SQLite via Nuxt server API routes (`server/api/`) using `better-sqlite3`
(already installed at v12.10.0).

**Rationale**: `better-sqlite3` is synchronous and runs only in Node.js (server context). Nuxt 4
server routes execute in the Nitro server — correct context for DB access. The client never
touches the DB directly; all reads/writes go through typed `$fetch` calls to `/api/*` endpoints.
A singleton DB connection is initialized once in `server/utils/db.ts` and reused across requests.

**Alternatives considered**:
- `@nuxt/content` SQLite — rejected; that module owns its own schema and is designed for markdown
  content, not relational app data
- File-based JSON — rejected; no atomic writes, harder to query, poor ordering support

---

## Decision: State Management

**Decision**: Nuxt's built-in `useState` composable + server-state via `useFetch`/`$fetch`.
No Pinia.

**Rationale**: The app has three isolated views (plan, present, archive) with modest shared state
(current review + agenda). `useState` is SSR-safe and sufficient. Pinia adds install overhead
without meaningful benefit for this scope.

**Alternatives considered**:
- Pinia — rejected for over-engineering a single-user local tool

---

## Decision: Screenshot Storage

**Decision**: Binary files written to `.data/screenshots/<uuid>.<ext>` on the server. Served via
a dedicated `GET /api/screenshots/[id]` route that streams from disk. Nuxt's `public/` folder is
not used (would pollute static assets).

**Rationale**: Keeps screenshot data alongside the SQLite DB in `.data/` (already gitignored by
Nuxt). No external storage, no cloud dependency (Principle I).

**File format support**: PNG, JPG, WebP (validated server-side by MIME type check on upload).
Max size: 10 MB per file (enforced in the upload route).

---

## Decision: Design System Adaptation

**Decision**: Adopt the LaabsLab CSS token set from the prototype (dark mode, Space Grotesk /
Manrope / JetBrains Mono) as a CSS layer in `app/assets/css/laabslab.css`. Map @nuxt/ui
component variants onto these tokens via TailwindCSS v4 theme configuration.

**Rationale**: The prototype has a complete, coherent design system. Recreating it in @nuxt/ui
terms means: use `@nuxt/ui` components for behavior/accessibility (UButton, UInput, UBadge,
UAvatar, UCard) and override visual appearance via the LaabsLab token variables.
This avoids writing raw HTML + CSS for every component while matching the prototype pixel-closely.

**Specific @nuxt/ui components used**:
- `UButton` — all interactive buttons (variant: solid / ghost / soft)
- `UBadge` — status chips (done / in-progress / blocked / live)
- `UInput`, `UTextarea` — all form fields
- `UAvatar` — presenter avatar stack (gradient backgrounds via computed style)
- `UCard` — archive sprint cards
- `USeparator` — section dividers
- `UDropdownMenu` — presenter picker in item editor
- `UModal` — screenshot lightbox

---

## Decision: Presenter Mode Routing

**Decision**: Full-screen presenter mode rendered at route `/present` (no layout, no nav bar).
Nuxt layout system: `present.vue` layout with `overflow: hidden; height: 100vh`.
Archive re-watch goes to `/archive/[id]/present`.

**Rationale**: Presenter mode MUST be distraction-free and full-bleed. Separating it from the
main layout (which has the top nav) is the cleanest approach. Keyboard events are scoped to the
page component with `onMounted`/`onUnmounted` listeners.

---

## Decision: Drag-to-Reorder Agenda

**Decision**: Implement drag-to-reorder using native HTML5 drag-and-drop (`draggable` + `dragover`
+ `drop` events). No external DnD library.

**Rationale**: The prototype uses the same approach. For a list of ≤30 items on a local desktop
browser, native DnD is sufficient. No touch support required (desktop-only, Principle V scope).

---

## Decision: Database File Location

**Decision**: `.data/review-master.sqlite` — alongside `.data/content/contents.sqlite`.

**Rationale**: `.data/` is Nuxt's standard location for generated/runtime data and is gitignored
by default. Consistent with where `@nuxt/content` puts its own SQLite DB.

---

## Decision: Presenter Name Entry

**Decision**: Free-text input on each task. No managed team member list.

**Rationale**: Avoids a separate "people management" feature. Aligns with Principle V (minimal
scope). Presenter name is only needed for display — no identity management required.

**Note**: The prototype used a curated PEOPLE array as a chip picker. This is NOT implemented.
`ItemEditor` uses a plain `UInput` for presenter name instead.

---

## Resolved: No auth, no multi-user

Per constitution Principle V and spec Assumptions: authentication and multi-user isolation are
out of scope. All API routes are unrestricted. The app is always single-user local.
