# Feature Specification: Sprint Review App

**Feature Branch**: `001-sprint-review-app`

**Created**: 2026-05-22

**Status**: Draft

**Input**: User description: "this app can be used to plan, execute and archive sprint-reviews. in planning the user writes down which tasks will be presented with their issueid and who the presenter is. also screenshots and/or a link to a website can be stored. during review the app feels like a slideshow (presenter mode). the archive shows all passed reviews and allows to inspect them again"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plan a Sprint Review (Priority: P1)

The planner creates a new sprint review entry and populates it with the tasks that will be
demonstrated. For each task, they record the issue ID, the name of the presenter, and optionally
attach one or more screenshots or a link to a live website. They can reorder tasks to match the
intended presentation sequence.

**Why this priority**: Planning is the entry point for everything else. Without a populated review,
execution and archiving have nothing to work with.

**Independent Test**: Create a review, add three tasks with varying combinations of issue ID,
presenter, screenshots, and URL. Verify all items are saved and listed in the correct order.

**Acceptance Scenarios**:

1. **Given** no reviews exist, **When** the planner creates a new sprint review with a name and sprint identifier, **Then** the review appears in the review list with status "Planned"
2. **Given** a planned review, **When** the planner adds a task with issue ID, presenter name, and a screenshot, **Then** the task appears in the review's task list with all fields visible
3. **Given** a planned review with multiple tasks, **When** the planner reorders the tasks, **Then** the new order is persisted and reflected in presenter mode

---

### User Story 2 - Execute a Review in Presenter Mode (Priority: P2)

The presenter launches the review in presenter mode. The app displays tasks one at a time in
slideshow fashion. Each slide shows the issue ID, presenter name, and any attached screenshot(s)
or a link to the associated website. The presenter navigates forward and backward through the
slides. When the last slide is completed, the review is marked as done and moved to the archive.

**Why this priority**: The core event is the live review. This is the feature's primary delivery
moment.

**Independent Test**: Open a planned review in presenter mode, navigate through all slides, confirm
screenshots and links render correctly, then complete the review and verify it appears in the
archive.

**Acceptance Scenarios**:

1. **Given** a planned review, **When** the presenter starts presenter mode, **Then** the first task slide appears full-screen with issue ID, presenter name, and any media
2. **Given** presenter mode is active, **When** the presenter navigates forward/backward, **Then** the adjacent slide appears without delay
3. **Given** a task with a website URL, **When** that slide is displayed, **Then** the URL is shown as a clickable link that opens in a new browser tab
4. **Given** the presenter completes the last slide and confirms the review is done, **Then** the review status changes to "Completed" and it moves to the archive

---

### User Story 3 - Browse and Inspect the Archive (Priority: P3)

After one or more reviews have been completed, the planner or any team member can open the archive
to see a list of all past reviews ordered by date. Selecting a past review shows all its tasks
with their original issue IDs, presenter names, screenshots, and links — identical to how they
appeared in presenter mode.

**Why this priority**: The archive provides a historical record of what was demonstrated and by
whom in each sprint, enabling retrospective reference.

**Independent Test**: Complete two reviews. Open the archive, verify both appear in reverse
chronological order. Open one and verify all tasks and media from planning are visible.

**Acceptance Scenarios**:

1. **Given** completed reviews exist, **When** the user opens the archive, **Then** reviews are listed in reverse chronological order showing review name, sprint identifier, and date
2. **Given** an archived review, **When** the user opens it, **Then** all tasks are shown with their issue IDs, presenter names, screenshots, and links
3. **Given** an archived review is open, **When** the user navigates task slides, **Then** the presentation layout from the original review is reproduced faithfully

---

### Edge Cases

- What happens when a task has neither a screenshot nor a website URL? (Task still appears on its slide with only issue ID and presenter name)
- What happens if the planner tries to start presenter mode with zero tasks? (Action is blocked with a clear message)
- What happens if a screenshot file is very large or an unsupported format? (Only standard image formats accepted; oversized files shown with a warning)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a new sprint review with a name and sprint identifier
- **FR-002**: System MUST allow users to add tasks to a review, each with: issue ID (required), presenter name (required as free-text input)
- **FR-003**: System MUST allow users to attach one or more screenshots (images) to a task
- **FR-004**: System MUST allow users to store a website URL on a task
- **FR-005**: System MUST allow users to reorder tasks within a review before it is started
- **FR-006**: System MUST provide a presenter mode that displays tasks one at a time in slideshow format
- **FR-007**: Presenter mode MUST support forward and backward navigation between task slides
- **FR-008**: Each slide MUST display: issue ID, presenter name, attached screenshots (if any), and website link (if any)
- **FR-009**: System MUST mark a review as "Completed" and move it to the archive when the presenter finalises it
- **FR-010**: System MUST provide an archive view listing all completed reviews in reverse chronological order
- **FR-011**: System MUST allow users to open any archived review and inspect all its tasks and media

### Key Entities

- **Sprint Review**: Represents one review event. Key attributes: name, sprint identifier, status (Planned / Completed), date created, date completed.
- **Review Task**: Represents a single item to be demonstrated. Key attributes: issue ID, presenter name, order index, screenshots (collection), website URL (optional). Belongs to one Sprint Review.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A planner can create a fully populated sprint review (5 tasks with media) in under 5 minutes
- **SC-002**: Slides transition during presenter mode without any perceptible delay
- **SC-003**: All tasks and media from a completed review remain fully accessible in the archive indefinitely
- **SC-004**: Presenter mode can be launched and the first slide is visible within 2 seconds of clicking "Start Review"
- **SC-005**: 100% of tasks added during planning appear in presenter mode in the correct order

## Clarifications

### Session 2026-05-22

- Q: Implementation note — which component library docs to reference? → A: Use ui.nuxt.com via the context7 MCP when implementing any @nuxt/ui components. All UI component lookups MUST go through this MCP during implementation.
- Q: How is the presenter name entered on a task — free-text or selected from a managed team list? → A: Free-text input. User types any name directly. No team member list management required.

## Assumptions

- Single-user, local-only usage — no authentication or multi-user access control required
- Screenshots are standard image formats (PNG, JPG, WebP); no video support assumed
- One URL per task is sufficient (multiple URLs not required)
- Reviews cannot be edited once started in presenter mode (planning is a pre-review activity)
- Data is stored locally; no export or sharing functionality required for initial version
- Presenter navigation uses both mouse/click and keyboard arrow keys
