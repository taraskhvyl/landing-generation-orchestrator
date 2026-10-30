import { existsSync } from 'node:fs';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { OUT_DIR } from '../src/config.ts';
import {
  InvalidError,
  NotFoundError,
  createPage,
  deletePage,
  duplicatePage,
  getRecord,
  listRecords,
  readStage,
  saveRecord,
  stageByName,
  writeStage,
} from '../src/pages.ts';
import { fix, nextStage, recheck, runStages } from '../src/pipeline.ts';
import { STAGES } from '../src/stages/index.ts';
import { BusyError, activeId, publish, startJob, subscribe } from './jobs.ts';

const PORT = Number(process.env.API_PORT ?? 8790);
const stages = STAGES.map(({ name, file }) => ({ name, file }));
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

const app = new Hono();

app.onError((e, c) => {
  if (e instanceof NotFoundError) return c.json({ error: e.message }, 404);
  if (e instanceof InvalidError) return c.json({ error: e.message }, 400);
  if (e instanceof BusyError) return c.json({ error: e.message }, 409);
  console.error(e);
  return c.json({ error: e.message }, 500);
});

app.get('/api/pages', async (c) => c.json({ pages: await listRecords(), activeId: activeId(), stages }));

app.post('/api/pages', async (c) => {
  const body = await c.req.json();
  if (activeId()) throw new BusyError('another page is running');
  const record = await createPage({ topic: str(body.topic) ?? '', lang: str(body.lang) ?? 'en', style: str(body.style), review: body.review !== false });
  startJob(record.id, (emit) => runStages(record.id, emit));
  return c.json(record, 201);
});

app.get('/api/pages/:id', async (c) => c.json({ record: await getRecord(c.req.param('id')), activeId: activeId(), stages }));

app.patch('/api/pages/:id', async (c) => {
  const record = await getRecord(c.req.param('id'));
  const body = await c.req.json();
  if (typeof body.review === 'boolean') record.review = body.review;
  await saveRecord(record);
  publish(record.id, { type: 'record', record });
  return c.json(record);
});

app.delete('/api/pages/:id', async (c) => {
  const id = c.req.param('id');
  if (activeId() === id) throw new BusyError('cannot delete a running page');
  await deletePage(id);
  return c.body(null, 204);
});

app.post('/api/pages/:id/duplicate', async (c) => {
  const body = await c.req.json();
  if (activeId()) throw new BusyError('another page is running');
  const copy = await duplicatePage(c.req.param('id'), str(body.style), 'design');
  startJob(copy.id, (emit) => runStages(copy.id, emit));
  return c.json(copy, 201);
});

/** Continue (no `from`) or re-run from a stage. */
app.post('/api/pages/:id/run', async (c) => {
  const id = c.req.param('id');
  const from = str((await c.req.json().catch(() => ({}))).from);
  const record = await getRecord(id);
  if (from) stageByName(from);
  else if (!nextStage(record)) throw new InvalidError('all stages are done; pick a stage to re-run');
  startJob(id, (emit) => runStages(id, emit, from));
  return c.json({ started: true }, 202);
});

app.post('/api/pages/:id/check', async (c) => {
  const id = c.req.param('id');
  await readStage(id, stageByName('html'));
  startJob(id, (emit) => recheck(id, emit));
  return c.json({ started: true }, 202);
});

app.post('/api/pages/:id/fix', async (c) => {
  const id = c.req.param('id');
  await readStage(id, stageByName('html'));
  startJob(id, (emit) => fix(id, emit));
  return c.json({ started: true }, 202);
});

app.get('/api/pages/:id/files/:stage', async (c) =>
  c.text(await readStage(c.req.param('id'), stageByName(c.req.param('stage')))),
);

app.put('/api/pages/:id/files/:stage', async (c) => {
  const id = c.req.param('id');
  if (activeId() === id) throw new BusyError('cannot edit while this page is running');
  const stage = stageByName(c.req.param('stage'));
  await getRecord(id);
  await writeStage(id, stage, await c.req.text());
  return c.body(null, 204);
});

app.get('/api/pages/:id/events', async (c) => {
  const id = c.req.param('id');
  const record = await getRecord(id);
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ data: JSON.stringify({ type: 'record', record }) });
    const unsubscribe = subscribe(id, (e) => void stream.writeSSE({ data: JSON.stringify(e) }));
    await new Promise<void>((resolve) => stream.onAbort(resolve));
    unsubscribe();
  });
});

// Generated files (page.html in a new tab, screenshots), then the built dashboard.
app.use('/out/*', serveStatic({ root: OUT_DIR, rewriteRequestPath: (p) => decodeURIComponent(p.replace(/^\/out/, '')) }));
if (existsSync('web/dist')) app.use('/*', serveStatic({ root: 'web/dist' })); // after `npm run build`

// A run interrupted by a restart can't resume mid-stage; mark it failed so it can be re-run.
for (const r of await listRecords()) {
  if (r.status !== 'running') continue;
  for (const [name, s] of Object.entries(r.stages)) if (s === 'running') r.stages[name] = 'failed';
  Object.assign(r, { status: 'failed', error: 'interrupted by server restart' });
  await saveRecord(r);
}

serve({ fetch: app.fetch, port: PORT, hostname: '127.0.0.1' }, () =>
  console.log(`API on http://127.0.0.1:${PORT}${process.env.OPENAI_API_KEY ? '' : '  (warning: OPENAI_API_KEY is not set)'}`),
);
