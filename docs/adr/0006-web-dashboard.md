# 6. Web dashboard instead of a CLI-first tool

Date: 2026-10-30 · Status: accepted

## Context
The process (research, searches, streaming copy, checks, retries) should be visible, and review/edit between Stages is awkward in a terminal.

## Decision
- **Stack:** Vite + React dashboard (`web/`), Hono API (`server/`), pipeline stays UI-free in `src/`. The CLI stays as a thin second entry point without review.
- **Live view:** the pipeline emits events (`record`, `stage-start`, `delta`, `search`, `log`); the server forwards them over SSE. Token streaming for every Stage; no half-rendered HTML preview.
- **State:** `out/<id>/run.json` per page, no database. Ids are `<slug>`, `<slug>-2`, …
- **Review:** per-page toggle, on by default. A run that stops for review simply ends; Continue starts a new run from the next Stage, so no request is held open waiting for the user.
- **Concurrency:** one Job at a time (run, re-check or fix). Others get HTTP 409.
- **Editing:** CodeMirror 6; `outline.json` is validated with its Zod schema before saving.
- **HTML stage view:** sandboxed `srcdoc` preview (no scripts) at 375px and 1280px, check results, Re-check (free), Fix with AI.
- **Dashboard list:** status, language, cost, updated; Duplicate with new style; Delete with confirmation.
- **Security:** API binds to 127.0.0.1; the OpenAI key never leaves the server; page ids and stage names are validated so requests can't escape `out/`.
- **Look:** SaaS-style shell (sidebar, stat cards, stage stepper, native `<dialog>` modals, toasts), Inter, light and dark via `prefers-color-scheme`.

## Consequences
Parallel runs or a queue later are a `server/jobs.ts` change only. A restart mid-run marks that run failed ("interrupted"); re-run it from the failed Stage. Moving past dozens of pages or multiple users would mean a real database and auth.
