import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { browserCheck } from './browser.ts';
import { seoCheck } from './seo.ts';

const page = (body: string, head = '<title>Dental CRM</title><meta name="description" content="CRM for dentists.">') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head>
<body><main><h1>Dental CRM</h1>${body}</main></body></html>`;

// SEO
assert.deepEqual(seoCheck(page(''), 'en'), []);
assert.deepEqual(seoCheck(page(''), 'en-US'), [], 'region subtag is fine');
const bad = seoCheck(page('<h1>again</h1><script src="https://x.js"></script>', `<title>${'x'.repeat(61)}</title>`), 'uk');
assert.equal(bad.length, 5, bad.join('\n')); // two h1, long title, no description, wrong lang, external script

// Browser
const dir = await mkdtemp(`${tmpdir()}/lp-check-`);
assert.deepEqual(await browserCheck(page('<p>ok</p>'), dir), []);
const broken = await browserCheck(page('<div style="width:600px">wide</div><script>nope()</script>'), dir);
assert.ok(broken.some((e) => e.startsWith('mobile (375px): horizontal overflow')), broken.join('\n'));
assert.ok(broken.some((e) => e.includes('JS error')), broken.join('\n'));
assert.ok(!broken.some((e) => e.startsWith('desktop (1280px): horizontal overflow')), 'desktop fits 600px');

console.log('checks.test.ts: all passed');
