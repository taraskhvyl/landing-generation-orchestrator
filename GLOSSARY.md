# Glossary

- **Topic** — the free-text subject of one landing page, given on the CLI (`"handmade leather wallet"`).
- **Slug** — URL-safe form of the Topic; names the page's folder `out/<slug>/`.
- **Stage** — one step of the pipeline. Each Stage reads earlier Stage files and writes exactly one file. Order: `research → outline → copy → design → html`.
- **Research** — web-searched facts, numbers and sources about the Topic (`research.md`). The thing that keeps a Page from being thin content.
- **Outline** — the Page's structure: sections, their goals, target keyword and search intent (`outline.json`, schema-validated).
- **Copy** — the final words of every section, in the Page language (`copy.md`).
- **Design** — the Page's own visual direction: palette, fonts, layout feel (`design.md`). Every Page has a different Design; there is no shared brand.
- **Page** — the finished self-contained HTML file (`page.html`), written by the LLM.
- **Check** — automatic validation of a Page after the html Stage: the **SEO check** (markup) and the **browser check** (layout, JS errors, accessibility). Failures trigger one retry of the html Stage.
- **Flagged** — a Page that still fails the Check after the retry. It is saved anyway and reported in the terminal.
- **Run record** — `out/<id>/run.json`: a page's topic, language, style, per-Stage status, latest Check result and total cost. The folder is the database.
- **Page id** — folder name `<slug>`, `<slug>-2`, … A new page never overwrites an existing one.
- **Review** — per-page toggle. On: a run stops after each Stage with status *Needs review*; **Continue** runs the next Stage. Off: runs straight through.
- **Re-run from here** — runs a Stage and every Stage after it, using files on disk (including your edits).
- **Duplicate** — new page with the same research, outline and copy, re-running design and html with a new style.
- **Fix with AI** — one html fix pass using the current Check errors.
- **Job** — the one pipeline operation running at a time (a run, a re-check or a fix). Its events stream to the dashboard over SSE.
