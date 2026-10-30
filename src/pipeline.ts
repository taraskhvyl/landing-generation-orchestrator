// Runs stages for a page and keeps its run.json in sync, emitting events for live views.
import { DEFAULT_MODEL } from './config.ts';
import { llmFor } from './llm.ts';
import { getRecord, pageDir, readStage, saveRecord, stageByName, writeStage } from './pages.ts';
import { STAGES } from './stages/index.ts';
import { checkPage, fixPage, html } from './stages/html.ts';
import type { Ctx, Emit, RunRecord, StageDef } from './types.ts';

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const finalStatus = (r: RunRecord) => (r.checks?.length ? 'flagged' : 'passed');

/** First stage that isn't done; where "Continue" resumes. */
export const nextStage = (r: RunRecord) => STAGES.find((s) => r.stages[s.name] !== 'done')?.name;

async function session(id: string, emit: Emit) {
  const record = await getRecord(id);
  const update = async () => {
    await saveRecord(record);
    emit({ type: 'record', record: structuredClone(record) });
  };
  const ctxFor = (stage: StageDef): Ctx => ({
    id,
    topic: record.topic,
    lang: record.lang,
    style: record.style,
    outDir: pageDir(id),
    read: (s) => readStage(id, s),
    emit,
    setChecks: (errors) => void (record.checks = errors),
    ...llmFor(stage.model ?? DEFAULT_MODEL, stage.name, {
      onCost: (usd) => void (record.cost += usd),
      onDelta: (text) => emit({ type: 'delta', stage: stage.name, text }),
      onSearch: (query) => emit({ type: 'search', stage: stage.name, query }),
    }),
  });
  return { record, update, ctxFor };
}

/**
 * Runs stages from `from` (default: the next unfinished one). With record.review on, stops after
 * one stage with status "review"; calling again continues.
 */
export async function runStages(id: string, emit: Emit, from?: string) {
  const { record, update, ctxFor } = await session(id, emit);
  const start = STAGES.indexOf(stageByName(from ?? nextStage(record) ?? STAGES[0].name));
  for (const s of STAGES.slice(start)) record.stages[s.name] = 'pending';
  record.status = 'running';
  record.error = undefined;
  await update();

  for (const [i, stage] of STAGES.entries()) {
    if (i < start) continue;
    try {
      record.stages[stage.name] = 'running';
      await update();
      emit({ type: 'stage-start', stage: stage.name });
      await writeStage(id, stage, await stage.run(ctxFor(stage)));
      record.stages[stage.name] = 'done';
    } catch (e) {
      record.stages[stage.name] = 'failed';
      record.status = 'failed';
      record.error = `${stage.name}: ${message(e)}`;
      await update();
      return record;
    }
    if (record.review && i < STAGES.length - 1) {
      record.status = 'review';
      await update();
      return record;
    }
  }
  record.status = finalStatus(record);
  await update();
  return record;
}

/** Re-runs the checks on page.html as it is on disk (e.g. after a hand edit). No LLM call. */
export async function recheck(id: string, emit: Emit) {
  return finishPage(id, emit, async (ctx, page) => (await checkPage(ctx, page), null));
}

/** "Fix with AI": one LLM fix pass over the current check errors. */
export async function fix(id: string, emit: Emit) {
  return finishPage(id, emit, async (ctx, page) => {
    const errors = await checkPage(ctx, page);
    return errors.length ? fixPage(ctx, page, errors) : null;
  });
}

async function finishPage(id: string, emit: Emit, work: (ctx: Ctx, page: string) => Promise<string | null>) {
  const { record, update, ctxFor } = await session(id, emit);
  const page = await readStage(id, html);
  record.status = 'running';
  await update();
  try {
    const updated = await work(ctxFor(html), page);
    if (updated) await writeStage(id, html, updated);
    record.status = finalStatus(record);
    record.error = undefined;
  } catch (e) {
    record.status = 'failed';
    record.error = `html: ${message(e)}`;
  }
  await update();
  return record;
}
