# 4. A design Stage gives each Page its own style

Date: 2026-10-30 · Status: accepted

## Decision
A design Stage between copy and html writes `design.md` (palette, fonts, layout feel) derived from the Topic and audience. Optional `--style "<hint>"` steers it. The html Stage must follow `design.md`.

## Why
Every Page needs a different look. An explicit, editable Stage lets you restyle one Page with `--from html` without regenerating copy, and stops the model from converging on one generic look.

## Consequences
No shared brand or design system. Accessibility of each invented palette is enforced by axe-core (ADR 5).
