// Thin CLI: creates a page and runs every stage without review. The same page then shows up in the dashboard.
import { parseArgs } from 'node:util';
import { createPage } from './pages.ts';
import { runStages } from './pipeline.ts';
import type { PipelineEvent } from './types.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { lang: { type: 'string', default: 'en' }, style: { type: 'string' } },
});

const topic = positionals.join(' ').trim();
if (!topic) {
  console.error('usage: npm run gen -- "<topic>" [--lang en] [--style "<hint>"]');
  process.exit(1);
}

const log = (e: PipelineEvent) => {
  if (e.type === 'stage-start') console.log(`→ ${e.stage}`);
  if (e.type === 'search') console.log(`  search: ${e.query}`);
  if (e.type === 'log') console.log(`  ${e.message}`);
};

const page = await createPage({ topic, lang: values.lang, style: values.style, review: false });
const record = await runStages(page.id, log);
for (const error of record.checks ?? []) console.log(`  ⚑ ${error}`);
console.log(`${record.status}${record.error ? `: ${record.error}` : ''}  out/${record.id}/  ≈ $${record.cost.toFixed(2)}`);
process.exit(record.status === 'failed' ? 1 : 0);
