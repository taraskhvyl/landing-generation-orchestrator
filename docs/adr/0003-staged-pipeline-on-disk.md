# 3. Five-Stage pipeline with editable files on disk

Date: 2026-10-30 · Status: accepted

## Decision
`research → outline → copy → design → html`, one LLM call per Stage, each writing a file to `out/<id>/`. Re-running from a Stage uses the files on disk (including your edits); review mode stops after each Stage. Both now live in the dashboard (ADR 6); the original `--from` / `--pause` CLI flags were removed.

## Why
- Google's scaled-content-abuse policy targets low-value mass pages, not AI text. Real Research plus human review is the main defence.
- Files give debugging, caching (don't redo research when fixing copy) and editorial control for one `writeFile` per Stage.
- Research returns plain text: combining `web_search` with structured output in one call is not confirmed, so only the outline Stage uses a schema.

## Consequences
Re-running a Stage overwrites its file and makes downstream files stale; `--from` always re-runs everything after it.
