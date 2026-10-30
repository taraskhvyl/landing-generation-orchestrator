# lp-generator

## Commands
- `npm run dev` - API (127.0.0.1:8790) + Vite dashboard (localhost:5173); both load `.env`
- `npm test` - page id/slug + SEO/browser check tests; no API key needed
- `npm run typecheck` - checks server (`tsconfig.json`) and web (`web/tsconfig.json`) separately
- `npm run gen -- "<topic>"` - CLI run of the full pipeline without review
- `npx playwright install chromium` - needed once for browser checks

## Code
- Node 22 runs `.ts` directly (type stripping): imports need `.ts` extensions, no enums/namespaces (`erasableSyntaxOnly`)
- `src/` is the pipeline and must stay free of HTTP/UI; `server/` exposes it; `web/` renders it
- New stage = one file in `src/stages/` + one entry in `STAGES` (`stages/index.ts`); stages reference each other by imported object (`ctx.read(outline)`), never by name strings
- Stages call the LLM only via `ctx.text` / `ctx.object` (streaming, cost tracking and model binding happen there)
- Page state lives in `out/<id>/run.json`, no DB; ids are validated in `pageDir()`, so route every path through it
- Decisions are recorded in `docs/adr/`, terms in `GLOSSARY.md`; update them when a decision changes

## Gotchas
- OpenAI SDK v7: `web_search` tool type, `zodTextFormat` from `openai/helpers/zod`, `responses.stream()` for deltas
- axe-core needs `browser.newContext()`, not `browser.newPage()`
- Slugs: cut length before trimming dashes (a trailing `-` makes the id invalid); topics can be Cyrillic
- Sandboxed `srcdoc` iframes look blank in browser-pane screenshots; zoom in to verify they rendered
