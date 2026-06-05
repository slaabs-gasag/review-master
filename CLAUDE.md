# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Local-only Nuxt 4 app for guiding agile sprint reviews. Runs as a presentation tool during Review events. Never deployed — local use only.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run generate     # static generation

npm run test         # all vitest tests
npm run test:unit    # unit tests only (test/unit/)
npm run test:nuxt    # nuxt component tests (test/nuxt/)
npm run test:e2e     # playwright e2e (tests/)
npm run test:e2e:ui  # playwright with UI
```

Run single vitest test: `npx vitest run test/unit/example.test.ts`

## Architecture

Nuxt 4 with file-based routing. Key modules:
- **@nuxt/ui** — component library built on TailwindCSS v4
- **@nuxt/content** — markdown/content management backed by SQLite (`.data/content/contents.sqlite`)
- **@nuxt/image** — image optimization

Test split:
- `test/unit/` — plain node environment, no Nuxt runtime
- `test/nuxt/` — full Nuxt environment via `@nuxt/test-utils`, happy-dom
- `tests/` — Playwright e2e, Chromium only

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/003-screenshot-notes-reorder/plan.md`.
<!-- SPECKIT END -->
