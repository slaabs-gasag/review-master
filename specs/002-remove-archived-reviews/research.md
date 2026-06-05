# Research: Remove Archived Reviews

**Phase 0 output** — all technical unknowns resolved

---

## Decision: Confirmation UI Pattern

**Decision**: Use `UModal` from `@nuxt/ui` v4 with `v-model:open` for the confirmation dialog.

**Rationale**: `UModal` is already available via `@nuxt/ui ^4.8.0` (auto-imported). It supports
`title`, `description`, `#footer` slot for action buttons, and `v-model:open` for programmatic
control. No additional dependency. Fits the existing UI component pattern in the project.

**Implementation**:
- `v-model:open` bound to a `ref<boolean>` controls visibility
- Confirm button calls the delete function; cancel closes the modal
- Error state shown inline within the modal footer

**Alternatives considered**:
- `useOverlay` programmatic API — more verbose for a simple confirm pattern; overkill here
- Native `window.confirm` — not dismissible via keyboard, visually inconsistent with app design

---

## Decision: SprintCard Delete Trigger Placement

**Decision**: Add an absolutely-positioned delete button **outside** the `NuxtLink` wrapper in
`archive/index.vue` using a relative-positioned container element. The button uses
`@click.stop` to prevent link navigation.

**Rationale**: `SprintCard` is a pure presentational component and should remain so. Injecting
delete logic into it would violate single-responsibility. The archive list template already
controls the `NuxtLink` wrapper — adding a sibling overlay button is the minimal, non-invasive
change.

**Implementation sketch**:
```vue
<div class="archive-card-wrap" style="position:relative;">
  <NuxtLink :to="`/archive/${review.id}`" style="text-decoration:none;">
    <SprintCard :review="review" :featured="i === 0 && activeFilter === null" />
  </NuxtLink>
  <button class="archive-delete-btn" @click.stop="openDeleteModal(review)">✕</button>
</div>
```

**Alternatives considered**:
- Emit `delete` event from `SprintCard` — requires modifying SprintCard and propagating the event
  up through NuxtLink which doesn't forward custom events

---

## Decision: Archive Detail Delete Placement

**Decision**: Add a "Delete review" button to the existing `plan-head-actions` div in
`archive/[id]/index.vue`, next to the existing "Re-watch" and "← Archive" buttons.

**Rationale**: The actions area is already defined and styled. After deletion the user is
navigated to `/archive` via `navigateTo('/archive')`.

---

## Decision: Error Handling

**Decision**: Catch errors from `$fetch` DELETE call and display an error message inline in the
confirmation modal footer. Do not navigate or close the modal on error.

**Rationale**: Matches the local-only, single-user context. No retry logic needed — user can
dismiss and try again.

---

## Decision: Post-Deletion State Update (Archive List)

**Decision**: After successful deletion from the archive list, remove the deleted review from the
local reactive `completed` ref directly (filter by id) rather than calling `refreshNuxtData` or
re-fetching all reviews.

**Rationale**: Avoids a full network round-trip for what is a simple client-side state removal.
The deleted item is known; optimistic removal is safe.

---

## No New Dependencies

All UI components (`UModal`, `UButton`) are from `@nuxt/ui` already installed. No new packages.
Satisfies Constitution Principle II (Official Libraries Preferred) and Principle I (Local-First).
