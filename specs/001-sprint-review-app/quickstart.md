# Quickstart: Sprint Review App

**How to validate the implementation is working end-to-end**

---

## Prerequisites

```bash
npm install       # install dependencies (already done)
npm run dev       # start dev server at http://localhost:3000
```

The SQLite database is created automatically at `.data/review-master.sqlite` on first server start.

---

## Validation Walkthrough

### 1. Create a sprint review

1. Open `http://localhost:3000`
2. The planning page loads with an empty state ("Create your first review")
3. Click "New review" → fill in name: "Sprint 47 · Review", sprint: "47" → Save
4. Review appears in the planning view

### 2. Add agenda items

1. Click "Add item" in the agenda list
2. Enter issue ID: `WSS-1242`, set presenter, status, tags
3. Repeat for 3 items minimum
4. Drag items to reorder — confirm new order persists after page refresh

### 3. Add screenshots

1. Select an agenda item
2. In the item editor, click "Add screenshot" or paste (⌘V) an image
3. Screenshot thumbnail appears in the item's shots grid
4. Confirm screenshot survives page refresh (loaded from `.data/screenshots/`)

### 4. Launch presenter mode

1. Click "Start review" button
2. App navigates to `/present/[id]` in full-screen mode
3. First item displays: screenshot fills viewport, chrome overlay visible
4. Press `→` / `←` / `Space` to navigate items
5. Press `Q` to open Q&A panel — enter a question, save it
6. Complete last item → "End review" → review appears in archive

### 5. Browse archive

1. Navigate to `/archive`
2. Completed review appears as a sprint card with stats
3. Click card → `/archive/[id]` shows all items in read-only view
4. Click "Re-watch" → re-enters presenter mode (read-only, Q&A captured questions visible)

### 6. Keyboard shortcuts

| Key     | Context          | Action                  |
|---------|------------------|-------------------------|
| `1`     | Any page         | Go to planning (`/`)    |
| `3`     | Any page         | Go to archive           |
| `→`     | Presenter mode   | Next item               |
| `←`     | Presenter mode   | Previous item           |
| `Space` | Presenter mode   | Next item               |
| `Q`     | Presenter mode   | Toggle Q&A panel        |
| `Esc`   | Presenter mode   | Exit to planning/archive|

---

## Smoke-test checklist

- [ ] Dev server starts without errors: `npm run dev`
- [ ] SQLite DB created at `.data/review-master.sqlite`
- [ ] `GET /api/reviews` returns `[]` on fresh install
- [ ] Can create a review via `POST /api/reviews`
- [ ] Can add items, reorder them, persist after refresh
- [ ] Screenshots upload, serve via `/api/screenshots/[id]`, persist after restart
- [ ] Presenter mode navigates with keyboard shortcuts
- [ ] Q&A entries persist (visible in archive re-watch)
- [ ] Completing a review moves it to archive
- [ ] `npm run test:unit` passes
- [ ] `npm run test:nuxt` passes
- [ ] `npm run test:e2e` passes (planning → present → archive full flow)
