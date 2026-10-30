import { runChecks } from '../checks/index.ts';
import type { Ctx, StageDef } from '../types.ts';
import { copy } from './copy.ts';
import { design } from './design.ts';
import { outline } from './outline.ts';

const instructions = (lang: string) => `You are a senior front-end developer. Build ONE self-contained HTML5 landing page.
Implement design.md exactly and use copy.md word for word. Requirements:
- <!doctype html>, <html lang="${lang}">, meta charset, meta viewport
- <title> and <meta name="description"> exactly from the outline; Open Graph title/description
- JSON-LD in <script type="application/ld+json">: WebPage, plus FAQPage if there is an FAQ
- Exactly one <h1>. Semantic landmarks: header, main, section, footer
- All CSS in one <style>. Mobile-first and responsive; nothing may overflow horizontally at 375px width
- No images: inline SVG (aria-hidden when decorative) and CSS only. Fonts only via Google Fonts <link>
- No external scripts. JavaScript only if essential, inline
- Visible focus states, respect prefers-reduced-motion, WCAG AA contrast everywhere
Return only the HTML, no explanation.`;

const extractHtml = (text: string) => text.match(/<!doctype html[\s\S]*<\/html>/i)?.[0] ?? text;
const list = (errors: string[]) => errors.map((e) => `- ${e}`).join('\n');

async function inputs(ctx: Ctx) {
  return `Outline:\n${await ctx.read(outline)}\n\ncopy.md:\n${await ctx.read(copy)}\n\ndesign.md:\n${await ctx.read(design)}`;
}

/** Checks the page and records the result. */
async function check(ctx: Ctx, page: string) {
  ctx.emit({ type: 'log', stage: 'html', message: 'running SEO + browser checks…' });
  const errors = await runChecks(page, ctx.lang, ctx.outDir);
  ctx.setChecks(errors);
  ctx.emit({ type: 'log', stage: 'html', message: errors.length ? `${errors.length} check error(s)` : 'checks passed' });
  return errors;
}

/** Asks the model to fix `errors` in `page`, then re-checks. Used by the automatic retry and by "Fix with AI". */
export async function fixPage(ctx: Ctx, page: string, errors: string[]) {
  ctx.emit({ type: 'stage-start', stage: 'html' });
  ctx.emit({ type: 'log', stage: 'html', message: `fixing ${errors.length} error(s)…` });
  const fixed = extractHtml(
    await ctx.text({
      instructions: instructions(ctx.lang),
      input: `${await inputs(ctx)}\n\nYour previous version failed these checks. Fix every one, change nothing else:\n${list(errors)}\n\nPrevious HTML:\n${page}`,
    }),
  );
  await check(ctx, fixed);
  return fixed;
}

export const html: StageDef = {
  name: 'html',
  file: 'page.html',
  // model: 'gpt-6-astra', // 5× the price; enable if Sol's pages look weak (ADR 2)
  run: async (ctx) => {
    const page = extractHtml(await ctx.text({ instructions: instructions(ctx.lang), input: await inputs(ctx) }));
    const errors = await check(ctx, page);
    return errors.length ? fixPage(ctx, page, errors) : page;
  },
};

export { check as checkPage };
