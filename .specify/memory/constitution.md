<!--
  SYNC IMPACT REPORT
  Version change: [TEMPLATE] → 1.0.0 (initial ratification)
  Modified principles: N/A — initial fill from template
  Added sections: Core Principles (5), Technology Stack, Development Workflow, Governance
  Removed sections: [SECTION_2_NAME], [SECTION_3_NAME] (replaced with concrete sections)
  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — Constitution Check section already references constitution dynamically
    ✅ .specify/templates/spec-template.md — no constitution-specific references; generic structure intact
    ✅ .specify/templates/tasks-template.md — no constitution-specific references; generic structure intact
  Follow-up TODOs: none — RATIFICATION_DATE set to today (2026-05-22, first known ratification)
-->

# Review Master Constitution

## Core Principles

### I. Local-First Execution

This application MUST run exclusively on the local machine of the presenter.
No deployment pipelines, no cloud hosting, and no external services are permitted at runtime.
All runtime dependencies MUST be resolvable from local `node_modules` without network access.

**Rationale**: The app runs during live sprint review events. Any network dependency creates a
failure mode exactly when reliability matters most.

### II. Official Libraries Preferred

The Nuxt ecosystem's official modules (`@nuxt/ui`, `@nuxt/content`, `@nuxt/image`) MUST be used
for their respective domains before any third-party alternative is considered.
Third-party libraries are permitted only when no official module covers the use case.
Every added dependency MUST be explicitly justified against this principle in the plan.

**Rationale**: Official modules track Nuxt's release cycle, reducing upgrade friction and
compatibility issues for a locally maintained tool with no dedicated ops team.

### III. Flawless Presentation Stability

The app MUST NOT produce runtime errors, visual glitches, or unexpected state changes during a
live presentation session.
Features MUST pass end-to-end tests (Playwright, Chromium) before being considered complete.
Unstable or partially implemented features MUST NOT merge to `main` without a green test suite.

**Rationale**: Sprint reviews are time-boxed. A visible crash or error undermines team confidence
at exactly the wrong moment.

### IV. Quick Execution

Cold startup (dev server ready) MUST complete within a timeframe acceptable for an ad-hoc session
start — no pre-warming required.
Page transitions and interactions MUST be instantaneous during normal presentation flow.
No blocking loaders or spinners are permitted on the critical presentation path.
Performance regressions MUST be caught before merge.

**Rationale**: The presenter MUST open and run the app without setup friction at the start of a
review event.

### V. Minimal Scope

Features MUST remain scoped to guiding agile sprint reviews on a single local machine.
Authentication, multi-user support, and remote access are out of scope permanently.
Every added feature MUST justify its value against the core sprint review use case.
YAGNI applies strictly — no speculative generality.

**Rationale**: Scope creep increases maintenance burden for a single-purpose, locally-run tool
with no dedicated maintainer team.

## Technology Stack

- **Framework**: Nuxt 4 with file-based routing
- **UI**: `@nuxt/ui` (TailwindCSS v4)
- **Content**: `@nuxt/content` (SQLite-backed markdown via `.data/content/contents.sqlite`)
- **Images**: `@nuxt/image`
- **Testing**: Vitest (unit + Nuxt component tests), Playwright (e2e, Chromium only)
- **Runtime**: Node.js, local only — no containerization or cloud runtime required

New dependencies MUST use official Nuxt/Vue ecosystem packages where available (Principle II).
Non-official packages require explicit justification in the feature plan.

## Development Workflow

- Unit tests (`test/unit/`) run in plain Node environment
- Nuxt component tests (`test/nuxt/`) run in full Nuxt runtime via `@nuxt/test-utils`
- E2E tests (`tests/`) run Playwright against Chromium only
- All three test suites MUST pass before merging to `main`
- E2E tests are the acceptance gate for Principle III (Flawless Presentation Stability)
- Each feature plan MUST include a Constitution Check gate before Phase 0 research

## Governance

This constitution supersedes all other practices in this project.
Amendments require: updated rationale, version increment per the rules below, and an updated
`Last Amended` date.

**Versioning rules**:
- MAJOR: Removal or backward-incompatible redefinition of an existing principle
- MINOR: New principle added or existing principle materially expanded
- PATCH: Clarifications, wording improvements, typo fixes

All feature plans MUST include a Constitution Check gate (see plan-template.md §Constitution Check).
Compliance is reviewed per feature during planning, not retroactively.
The agent (Claude Code or equivalent) MUST flag any plan that violates these principles rather than
proceeding silently.

**Version**: 1.0.0 | **Ratified**: 2026-05-22 | **Last Amended**: 2026-05-22
