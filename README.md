# Pagecraft: landing page generator

Generates research-backed SEO landing pages from a topic: **research → outline → copy → design → html**, then checks each page in a real browser.
A web dashboard shows every stage live and lets you review, edit and re-run any of them.
Terms: [GLOSSARY.md](GLOSSARY.md). Decisions: [docs/adr/](docs/adr/).

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then put your OPENAI_API_KEY in .env
```

## Use

```bash
npm run dev     # dashboard on http://localhost:5173 (API on 127.0.0.1:8790, override with API_PORT)
```

In the dashboard: enter a topic, then watch each stage stream in. With **Review each stage** on, the run stops after every stage, so you can edit its file and **Continue**. Any finished stage can be **Re-run from here**. On the HTML stage you get a live preview (mobile and desktop), the check results, **Re-check** after hand edits, and **Fix with AI**. **Duplicate** keeps research, outline and copy and re-runs design and HTML with a new style.

CLI, same pipeline without review; the page then shows up in the dashboard:

```bash
npm run gen -- "best CRM for dentists" --lang en --style "calm, clinical, mint"
```

Production-ish: `npm run build && npm start` serves the built dashboard from the API server.

Each page lives in `out/<id>/`: `run.json` (status, stages, checks, cost) plus `research.md`, `outline.json`, `copy.md`, `design.md`, `page.html`, `mobile.png`, `desktop.png`.

## Structure

```
src/                 the pipeline: no HTTP, no UI
  types.ts           StageDef, Ctx, RunRecord, PipelineEvent
  config.ts          default model, prices, output folder
  llm.ts             streaming OpenAI calls bound to a model (ctx.text / ctx.object)
  pages.ts           storage: out/<id>/ folders, run.json, stage files, id validation
  pipeline.ts        runStages (with review stops), recheck, fix
  stages/            one file per stage; index.ts = pipeline order; rules.ts = shared prompt text
  checks/            seo.ts (markup), browser.ts (Playwright + axe), index.ts
  cli.ts             thin CLI entry
server/              Hono API: REST + SSE; jobs.ts = the single active job and event bus
web/src/             React dashboard (Vite): list, run view, CodeMirror editor, preview
```

Add a stage: create `src/stages/<name>.ts` exporting a `StageDef`, add it to `STAGES` in `stages/index.ts`. Read earlier output with `ctx.read(otherStage)`, call the LLM with `ctx.text` / `ctx.object` (output streams to the dashboard automatically), and set `model` on the stage to override the default. The API and UI pick it up with no changes.

## Test

```bash
npm test          # page ids/slugs + SEO and browser checks, no API key needed
npm run typecheck # server and web
```
