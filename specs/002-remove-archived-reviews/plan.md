# Implementation Plan: Remove Archived Reviews

**Branch**: `002-remove-archived-reviews` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)

## Summary

Add a delete action to the archive list and archive detail pages, backed by the existing
`DELETE /api/reviews/:id` server endpoint. Each delete is gated by a `UModal` confirmation
dialog. No new server routes or dependencies are needed.

## Technical Context

**Language/Version**: TypeScript / Vue 3 (Nuxt 4)

**Primary Dependencies**: `@nuxt/ui ^4.8.0` (UModal, UButton — auto-imported)

**Storage**: SQLite via `better-sqlite3`; cascade deletion already implemented server-side

**Testing**: Vitest (unit + Nuxt component), Playwright e2e (Chromium)

**Target Platform**: Local desktop — Node.js dev server

**Project Type**: Desktop web app (local presentation tool)

**Performance Goals**: Deletion completes and UI updates within 1 second on local machine

**Constraints**: No new npm packages; all UI via `@nuxt/ui` official components (Constitution II)

**Scale/Scope**: Single user, single machine — no concurrency concerns

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First Execution | ✅ PASS | No external services; DELETE goes to local Nitro server |
| II. Official Libraries Preferred | ✅ PASS | UModal from @nuxt/ui; no third-party additions |
| III. Flawless Presentation Stability | ✅ PASS | Confirmation modal prevents accidental deletion; e2e tests required |
| IV. Quick Execution | ✅ PASS | Optimistic client-side removal; no page reload |
| V. Minimal Scope | ✅ PASS | Scoped to archive pages only; no auth/multi-user |

## Project Structure

### Documentation (this feature)

```text
specs/002-remove-archived-reviews/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (from /speckit-tasks)
```

### Source Code Changes

```text
app/
├── pages/
│   ├── archive/
│   │   ├── index.vue              # Add delete button overlay + UModal confirmation
│   │   └── [id]/
│   │       └── index.vue          # Add delete button in actions bar + UModal confirmation
│   └── components/
│       └── archive/
│           └── SprintCard.vue     # No changes — remains presentational
test/
└── e2e/
    └── archive-delete.spec.ts     # New Playwright e2e test
```

## Implementation Steps

### Step 1 — Archive List: Delete Trigger

In `app/pages/archive/index.vue`:

1. Add reactive state:
   ```ts
   const deleteTarget = ref<ReviewWithItems | null>(null)
   const deleteOpen = ref(false)
   const deleteError = ref<string | null>(null)
   const deleteLoading = ref(false)

   function openDeleteModal(review: ReviewWithItems) {
     deleteTarget.value = review
     deleteError.value = null
     deleteOpen.value = true
   }
   ```

2. Wrap each archive card in a relative-positioned container and add a delete trigger button
   **outside** the `NuxtLink` (so clicks don't navigate):
   ```vue
   <div class="archive-card-wrap" style="position:relative;">
     <NuxtLink :to="`/archive/${review.id}`" style="text-decoration:none;">
       <SprintCard :review="review" :featured="i === 0 && activeFilter === null" />
     </NuxtLink>
     <button class="archive-delete-btn" @click.stop="openDeleteModal(review)">
       <!-- trash icon -->
     </button>
   </div>
   ```

3. Add a single `UModal` (outside the loop) for confirmation:
   ```vue
   <UModal
     v-model:open="deleteOpen"
     title="Delete review?"
     :description="`This will permanently delete &quot;${deleteTarget?.name}&quot; and all its data.`"
   >
     <template #footer>
       <span v-if="deleteError" style="color:var(--error);font-size:var(--text-xs);">
         {{ deleteError }}
       </span>
       <UButton color="neutral" variant="ghost" :disabled="deleteLoading" @click="deleteOpen = false">
         Cancel
       </UButton>
       <UButton color="error" :loading="deleteLoading" @click="confirmDelete">
         Delete
       </UButton>
     </template>
   </UModal>
   ```

4. Implement `confirmDelete`:
   ```ts
   async function confirmDelete() {
     if (!deleteTarget.value) return
     deleteLoading.value = true
     deleteError.value = null
     try {
       await $fetch(`/api/reviews/${deleteTarget.value.id}`, { method: 'DELETE' })
       completed.value = completed.value?.filter(r => r.id !== deleteTarget.value!.id) ?? []
       deleteOpen.value = false
     } catch {
       deleteError.value = 'Deletion failed. Please try again.'
     } finally {
       deleteLoading.value = false
     }
   }
   ```

### Step 2 — Archive Detail: Delete Trigger

In `app/pages/archive/[id]/index.vue`:

1. Add same reactive state (`deleteOpen`, `deleteError`, `deleteLoading`).

2. Add delete button to `plan-head-actions`:
   ```vue
   <button class="rm-btn rm-btn-ghost rm-btn-danger" @click="deleteOpen = true">
     Delete
   </button>
   ```

3. Add `UModal` confirmation (same pattern as Step 1).

4. Implement `confirmDelete` — on success call `navigateTo('/archive')`.

### Step 3 — Styling

Add minimal CSS for `.archive-delete-btn` and `.archive-card-wrap` to the archive page styles.
The delete button should be visually subtle (appears on hover) to avoid cluttering the grid.

### Step 4 — E2E Tests

New file `tests/archive-delete.spec.ts`:

- Test: Delete from archive list — creates a review, completes it, navigates to archive, deletes,
  verifies card gone
- Test: Cancel delete — verifies modal closes without deleting
- Test: Delete from detail page — navigates to detail, deletes, verifies redirect to `/archive`

## Complexity Tracking

No constitution violations. All gates pass.
