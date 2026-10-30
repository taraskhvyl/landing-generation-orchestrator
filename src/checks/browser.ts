import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';

const VIEWPORTS = { mobile: { width: 375, height: 812 }, desktop: { width: 1280, height: 800 } };

/** Renders the page at mobile + desktop width, saves <outDir>/<viewport>.png, returns errors. */
export async function browserCheck(html: string, outDir: string): Promise<string[]> {
  const errors = new Set<string>();
  const browser = await chromium.launch();
  try {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.on('console', (m) => m.type() === 'error' && errors.add(`${name}: console error: ${m.text()}`));
      page.on('pageerror', (e) => errors.add(`${name}: JS error: ${e.message}`));
      await page.setContent(html, { waitUntil: 'load' });

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) errors.add(`${name} (${viewport.width}px): horizontal overflow of ${overflow}px`);

      const { violations } = await new AxeBuilder({ page }).analyze();
      for (const v of violations)
        errors.add(`accessibility: ${v.id}: ${v.help} (e.g. ${v.nodes[0]?.target.join(' ')}; ${v.nodes.length} element(s))`);

      await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return [...errors];
}
