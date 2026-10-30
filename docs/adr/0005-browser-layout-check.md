# 5. Browser layout check with Playwright and axe-core

Date: 2026-10-30 · Status: accepted

## Decision
After the html Stage, the Check runs:
- **SEO check** (`linkedom`): exactly one `<h1>`, `<title>` ≤ 60 chars, meta description ≤ 160 chars, `<html lang>` matches `--lang`, viewport meta, no external scripts.
- **Browser check** (Playwright Chromium at 375px and 1280px): no horizontal overflow, no console/JS errors, no axe-core violations; saves `mobile.png` and `desktop.png`.

All errors are combined into one list. On failure the html Stage is retried once with that list; if it still fails, the Page is saved and Flagged.

## Why
LLM-written HTML (ADR 1) most often breaks on overflow on mobile, missing meta tags, and low-contrast invented palettes (ADR 4). These are objective and cheap to detect. Lighthouse and vision-model critique were rejected as slow/fuzzy for now.

## Consequences
Needs a ~150 MB Chromium download (`npx playwright install chromium`). No canonical tag or sitemap is checked: deployment is out of scope.
