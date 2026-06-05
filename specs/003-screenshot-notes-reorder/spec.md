# Feature Specification: Screenshot Notes, Reorder, and Remove Items

**Feature Branch**: `003-screenshot-notes-reorder`

**Created**: 2026-06-05

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Item from Review (Priority: P1)

A presenter preparing a sprint review realizes an item should not be presented (wrong sprint, cancelled). They need to remove it from the agenda without having to delete the entire review.

**Why this priority**: Removing items is a basic data management need. Without it, the agenda can only grow — there is no corrective action available during planning.

**Independent Test**: Can be fully tested by selecting an item on the planning page and clicking a delete/remove button, confirming the item disappears from the agenda list. Delivers a clean agenda immediately.

**Acceptance Scenarios**:

1. **Given** a review in "planned" or "plan_finished" status with at least one item, **When** the user activates the remove action for a specific item, **Then** the item is permanently removed from the agenda and the list updates immediately without a page reload.
2. **Given** a review with only one item, **When** the user removes that last item, **Then** the agenda becomes empty and the UI reflects the empty state correctly.
3. **Given** the user activates the remove action, **When** a confirmation is required, **Then** the user must confirm before the item is deleted (accidental deletion prevention).

---

### User Story 2 - Add Notes to a Screenshot (Priority: P2)

A presenter uploads a screenshot and wants to annotate it with context or talking points, so during the live review the note is visible alongside the image.

**Why this priority**: Notes turn screenshots from passive images into guided talking points — directly improves presentation quality.

**Independent Test**: Can be fully tested by uploading a screenshot, entering text in a notes field attached to that screenshot, saving, then verifying the note persists after page reload and appears in the presenter view alongside the screenshot.

**Acceptance Scenarios**:

1. **Given** an item with at least one screenshot, **When** the user clicks into the notes area for that screenshot, **Then** a text input becomes active and the user can type notes.
2. **Given** the user has typed notes for a screenshot, **When** the user saves (blur or explicit save), **Then** the note is persisted and visible the next time the item is opened.
3. **Given** a screenshot with notes in the presenter view, **When** the slide for that item is shown, **Then** the screenshot notes are visible to the presenter.

---

### User Story 3 - Reorder Screenshots (Priority: P3)

A presenter has uploaded multiple screenshots in the wrong order. They need to reorder them so the presentation flow makes sense.

**Why this priority**: Ordering matters for storytelling. Without reorder, the only workaround is delete-and-re-upload, which is friction.

**Independent Test**: Can be tested independently by uploading 2+ screenshots to an item, then dragging one to a new position and verifying the new order persists after page reload.

**Acceptance Scenarios**:

1. **Given** an item with two or more screenshots, **When** the user drags a screenshot to a new position in the grid, **Then** the screenshots are reordered immediately in the UI.
2. **Given** the user has reordered screenshots, **When** the page is refreshed, **Then** the new order is preserved.
3. **Given** screenshots are reordered, **When** the presenter view shows that item's slides, **Then** the screenshots appear in the updated order.

---

### Edge Cases

- What happens when a user tries to remove an item from an active (live) review? Action should be blocked or require stronger confirmation.
- What happens if a screenshot note exceeds a reasonable length? Graceful truncation or scrollable area in presenter view.
- What happens when reordering is triggered but only one screenshot exists? No-op, drag handles not shown or disabled.
- What if a note save fails due to a server error? User sees an error and the previous value is preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to remove an individual item from a review agenda during planning (status: planned or plan_finished).
- **FR-002**: Removing an item MUST require explicit confirmation to prevent accidental deletion.
- **FR-003**: After item removal, the agenda list MUST update immediately without a full page reload.
- **FR-004**: Each screenshot MUST support an optional free-text notes field.
- **FR-005**: Screenshot notes MUST be persisted and survive page reload.
- **FR-006**: Screenshot notes MUST be visible in the presenter view alongside the image.
- **FR-007**: Users MUST be able to reorder screenshots within an item by dragging.
- **FR-008**: The reordered screenshot sequence MUST be persisted server-side.
- **FR-009**: The presenter view MUST display screenshots in the persisted order.
- **FR-010**: Item removal MUST NOT be available for items in a live/active review without strong confirmation.

### Key Entities

- **Screenshot**: Existing entity gains a `notes` (text, nullable) field and its existing `order_index` field is actively used for user-controlled reordering.
- **ReviewItem**: Existing entity, gains a remove action accessible from the planning page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can remove an item from the planning page with no more than 2 interactions (e.g., click delete → confirm).
- **SC-002**: Screenshot notes entered during planning are visible in the presenter view within the same session.
- **SC-003**: Reordered screenshots appear in the correct order in both the planning editor and the presenter view after a page reload.
- **SC-004**: All three sub-features are covered by end-to-end tests that pass on Chromium before merging.

## Assumptions

- Item removal is only available during planning (status: planned or plan_finished). Active and completed reviews are immutable.
- Screenshot notes are plain text (no markdown rendering needed for v1).
- Screenshot reordering uses the same drag pattern already in use for agenda item reordering (useDragReorder composable).
- No change is needed to the screenshot upload flow — reordering and notes are post-upload operations.
- The presenter view already renders screenshots per item; changes are limited to ordering and displaying notes.
