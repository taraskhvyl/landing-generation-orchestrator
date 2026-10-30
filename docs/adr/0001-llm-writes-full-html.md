# 1. The LLM writes the full HTML of each Page

Date: 2026-10-30 · Status: accepted

## Context
The usual programmatic-SEO advice is: the LLM fills a JSON schema and fixed templates render it, which keeps markup consistent across hundreds of pages.

## Decision
The LLM writes one self-contained HTML file per Page (inline CSS, no images, CSS/SVG only).

## Why
- Scale is dozens of pages, not hundreds. Every page can be reviewed by a human.
- Every Page must have its own distinct look (see ADR 4); templates fight that.
- Consistency risks are covered by the Check (ADR 5) instead of by templates.

## Consequences
Markup varies between Pages. If the site grows to hundreds of Pages or needs a shared brand, revisit: move to schema + templates.
