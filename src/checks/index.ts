import { browserCheck } from './browser.ts';
import { seoCheck } from './seo.ts';

/** All checks for a finished page; empty array means it passed. */
export const runChecks = async (html: string, lang: string, outDir: string) => [
  ...seoCheck(html, lang),
  ...(await browserCheck(html, outDir)),
];
