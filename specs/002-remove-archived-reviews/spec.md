# Feature Specification: Remove Archived Reviews

**Feature Branch**: `002-remove-archived-reviews`

**Created**: 2026-06-05

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete from Archive List (Priority: P1)

A sprint master wants to permanently delete a completed review from the archive list page when it is no longer needed (e.g., old sprint data, created by mistake).

**Why this priority**: The archive list is the primary place users browse completed reviews. Deletion from the list avoids requiring navigation into the detail view first, making it the most efficient flow.

**Independent Test**: Can be fully tested by navigating to `/archive`, triggering delete on a review card, and confirming the review disappears from the list.

**Acceptance Scenarios**:

1. **Given** the archive list has one or more completed reviews, **When** the user activates the delete action on a review card, **Then** a confirmation prompt appears asking the user to confirm deletion.
2. **Given** the confirmation prompt is shown, **When** the user confirms, **Then** the review and all its associated data are permanently removed and the card disappears from the list.
3. **Given** the confirmation prompt is shown, **When** the user cancels, **Then** nothing is deleted and the archive list is unchanged.
4. **Given** the archive list has exactly one review and it is deleted, **When** deletion completes, **Then** the empty state is shown.

---

### User Story 2 - Delete from Archive Detail (Priority: P2)

A sprint master viewing a specific completed review's detail page wants to delete it without returning to the list first.

**Why this priority**: Useful when the user is already in the detail view and decides to remove the review. Lower priority than list deletion since the list is the primary entry point.

**Independent Test**: Can be tested by navigating to `/archive/[id]`, triggering delete, confirming, and verifying redirect to `/archive`.

**Acceptance Scenarios**:

1. **Given** the user is on an archive detail page, **When** the user activates the delete action, **Then** a confirmation prompt appears.
2. **Given** the confirmation prompt is shown and user confirms, **When** deletion succeeds, **Then** the user is redirected to `/archive`.

---

### Edge Cases

- What happens when deletion fails (server/network error)? An error message is shown; the review remains in the list.
- What happens if the review was already deleted (concurrent access)? A user-friendly "not found" message is shown.
- Can a non-completed (active/planned) review be deleted via this UI? No — the delete action is only available for completed/archived reviews.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to initiate deletion of a completed review from the archive list page.
- **FR-002**: Users MUST be able to initiate deletion of a completed review from the archive detail page.
- **FR-003**: System MUST present a confirmation dialog before permanently deleting any review.
- **FR-004**: System MUST permanently delete the review and all associated items, screenshots, and QA entries upon confirmed deletion.
- **FR-005**: System MUST redirect the user to `/archive` after successful deletion from the detail page.
- **FR-006**: System MUST display a user-friendly error message if deletion fails.
- **FR-007**: System MUST NOT expose the delete action for reviews that are not in `completed` status.

### Key Entities

- **Review**: A sprint review record with status `completed`; deletion removes it and cascades to items, screenshots, and QA entries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can delete a completed review in under 5 seconds (two interactions: activate delete, confirm).
- **SC-002**: Deletion is confirmed with a prompt — zero accidental deletions without confirmation.
- **SC-003**: After deletion, the archive list reflects the change without requiring a page reload.
- **SC-004**: All associated data (items, screenshots, QA) is removed along with the review.

## Assumptions

- The server-side DELETE endpoint (`DELETE /api/reviews/:id`) already exists and handles cascade deletion including screenshot file cleanup.
- Only locally-run single-user use (no concurrent multi-user conflict handling required beyond a friendly error).
- Mobile layout is out of scope — app is used as a local presentation tool on desktop.
- No soft-delete or undo/restore functionality is needed; deletion is permanent.
