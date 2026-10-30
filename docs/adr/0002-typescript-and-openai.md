# 2. TypeScript with the OpenAI SDK

Date: 2026-10-30 · Status: accepted

## Decision
TypeScript on Node 22+ (native type stripping, no build step), official `openai` SDK, Zod 4 for the one structured Stage. All Stages default to `gpt-6.1-sol` (`DEFAULT_MODEL`); a Stage overrides it with its own `model` field.

## Why
- Output is web pages; HTML parsing and browser checks are native in the JS ecosystem.
- The Responses API has a built-in `web_search` tool, so research needs no extra search provider or key.
- `gpt-6-astra` is 5× the price of Sol (2026-10: $10/$50 vs $2/$10 per 1M tokens). Start with Sol (~$0.30/page) and switch only the html Stage if quality needs it.

## Consequences
Locked to one provider. Swapping means rewriting the one `llm()` helper, not the pipeline.
