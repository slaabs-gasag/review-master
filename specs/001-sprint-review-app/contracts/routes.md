# UI Route Contract: Sprint Review App

Nuxt 4 file-based routing. All routes render within the app shell unless a custom layout is specified.

---

## Route Table

| Route                    | Layout     | Component               | Description                                     |
|--------------------------|------------|-------------------------|-------------------------------------------------|
| `/`                      | `default`  | `pages/index.vue`       | Planning view — current/latest planned review   |
| `/reviews/new`           | `default`  | `pages/reviews/new.vue` | Create new sprint review                        |
| `/present/[id]`          | `present`  | `pages/present/[id].vue`| Presenter mode (full-screen, no nav)            |
| `/archive`               | `default`  | `pages/archive/index.vue`| Archive list — all completed reviews           |
| `/archive/[id]`          | `default`  | `pages/archive/[id].vue`| Archived review detail (read-only items list)  |
| `/archive/[id]/present`  | `present`  | `pages/archive/[id]/present.vue` | Re-watch archived review (read-only) |

---

## Layouts

### `default` layout (`app/layouts/default.vue`)

- Top navigation bar (64px fixed height)
- Brand logo + wordmark on the left
- Mode tabs in center: **Plan** `[1]` / **Present** (link only, goes to active review) / **Archive** `[3]`
- Settings icon on the right
- `<slot/>` fills remaining viewport height (`height: calc(100vh - 64px)`)
- Global keyboard shortcuts: `1` → `/`, `3` → `/archive`

### `present` layout (`app/layouts/present.vue`)

- No nav bar
- Full viewport: `height: 100vh; overflow: hidden`
- Black/near-black background
- Used for both live presenter mode and archive re-watch

---

## Page Contracts

### `/` — Planning View

**State**: Loads the most recent review with status `planned`. If none exists, shows
a "Create your first review" empty state with a CTA linking to `/reviews/new`.

**Layout**: Two-column grid (agenda list left | item editor right)

**Interactions**:
- Select agenda item → loads item editor in right pane
- Drag agenda rows to reorder → calls `PUT /api/reviews/[id]/items/reorder`
- "Add item" → inline form below the list, calls `POST /api/reviews/[id]/items`
- "Start review" → navigates to `/present/[id]`
- Status counter in header: `N/Total ready · M blocked`

---

### `/present/[id]` — Presenter Mode

**State**: Loads review with all items + screenshots. Starts at item index 0.

**Layout**: Full-bleed — screenshots fill viewport. Floating chrome overlay (four corners):
- Top-left: issue ID chip + live dot + item title
- Top-right: progress pips + item counter + close (×) button
- Bottom-left: presenter avatar + name + role
- Bottom-right: Q&A toggle button + nav buttons (← / →)
- Side peek panel (collapsible): agenda list

**Keyboard shortcuts**:
- `→` or `Space`: next item
- `←`: previous item
- `Escape`: exit presenter mode → navigate back to `/`
- `Q`: toggle Q&A panel

**End-of-review**: After the last item, a completion screen appears with "End review" button.
Clicking it calls `PUT /api/reviews/[id]` with `{ status: "completed" }` then redirects to `/archive`.

---

### `/archive` — Archive List

**State**: Loads all reviews with status `completed`, ordered by `completed_at` descending.

**Layout**:
- Header with stats strip (sprints archived, items shipped, Q&A captured, presenter count)
- Filter pills by team
- Grid of sprint cards (2-3 columns)

**Interactions**:
- Click sprint card → `/archive/[id]`
- "Re-watch" button on card → `/archive/[id]/present`

---

### `/archive/[id]` — Archive Detail

**State**: Loads a completed review with all items, screenshots, and Q&A entries.

**Layout**: Read-only version of the planning view (no drag handles, no edit controls).
Shows all items with their screenshots and captured Q&A per item.

**Interactions**:
- "Re-watch" button → `/archive/[id]/present`
- Back link → `/archive`

---

### `/archive/[id]/present` — Archive Re-watch

Same as `/present/[id]` but:
- Top bar shows "← Back to archive" + sprint metadata + "read-only" chip
- No live dot in chrome
- No Q&A capture input (Q&A panel is read-only, showing saved questions)
- No "End review" action
- `Escape` → back to `/archive/[id]`
