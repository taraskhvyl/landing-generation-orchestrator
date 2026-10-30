// Storage: one folder per page in out/<id>/, holding run.json and one file per stage.
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OUT_DIR } from './config.ts';
import { STAGES } from './stages/index.ts';
import type { RunRecord, StageDef } from './types.ts';

export class NotFoundError extends Error {}
export class InvalidError extends Error {}

const ID = /^[\p{L}\p{N}]+(-[\p{L}\p{N}]+)*$/u;

// Cut to 80 characters (by code point) before trimming dashes, so a cut never leaves a trailing "-".
export const slugify = (topic: string) =>
  [...topic.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-')].slice(0, 80).join('').replace(/^-|-$/g, '') || 'page';

/** Folder of a page. Validates the id, so request params can't escape OUT_DIR. */
export function pageDir(id: string) {
  if (!ID.test(id)) throw new InvalidError(`invalid page id "${id}"`);
  return join(OUT_DIR, id);
}

export function stageByName(name: string): StageDef {
  const stage = STAGES.find((s) => s.name === name);
  if (!stage) throw new InvalidError(`unknown stage "${name}", expected one of: ${STAGES.map((s) => s.name).join(', ')}`);
  return stage;
}

const exists = (path: string) => stat(path).then(() => true, () => false);

export async function getRecord(id: string): Promise<RunRecord> {
  const file = join(pageDir(id), 'run.json');
  if (!(await exists(file))) throw new NotFoundError(`page "${id}" not found`);
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function saveRecord(record: RunRecord) {
  record.updatedAt = new Date().toISOString();
  await writeFile(join(pageDir(record.id), 'run.json'), JSON.stringify(record, null, 2));
}

export async function listRecords(): Promise<RunRecord[]> {
  const entries = await readdir(OUT_DIR, { withFileTypes: true }).catch(() => []);
  const records = await Promise.all(
    entries.filter((e) => e.isDirectory() && ID.test(e.name)).map((e) => getRecord(e.name).catch(() => null)),
  );
  return records.filter((r) => r !== null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** First free id: "<slug>", then "<slug>-2", "<slug>-3"… Safe because only one run happens at a time. */
async function nextId(topic: string) {
  const base = slugify(topic);
  for (let n = 1; ; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    if (!(await exists(join(OUT_DIR, id)))) return id;
  }
}

export async function createPage(input: { topic: string; lang: string; style?: string; review: boolean }) {
  const topic = input.topic.trim();
  if (!topic) throw new InvalidError('topic is required');
  const id = await nextId(topic);
  await mkdir(pageDir(id), { recursive: true });
  const now = new Date().toISOString();
  const record: RunRecord = {
    id,
    topic,
    lang: input.lang.trim() || 'en',
    style: input.style?.trim() || undefined,
    review: input.review,
    status: 'review',
    stages: Object.fromEntries(STAGES.map((s) => [s.name, 'pending'])),
    checks: null,
    cost: 0,
    createdAt: now,
    updatedAt: now,
  };
  await saveRecord(record);
  return record;
}

/** Copies a page's stages before `fromStage` into a new page with a new style. */
export async function duplicatePage(id: string, style: string | undefined, fromStage: string) {
  const src = await getRecord(id);
  const start = STAGES.indexOf(stageByName(fromStage));
  const copy = await createPage({ ...src, style });
  for (const stage of STAGES.slice(0, start)) {
    const file = join(pageDir(id), stage.file);
    if (!(await exists(file))) throw new InvalidError(`cannot duplicate: stage "${stage.name}" has no output yet`);
    await cp(file, join(pageDir(copy.id), stage.file));
    copy.stages[stage.name] = 'done';
  }
  await saveRecord(copy);
  return copy;
}

export async function deletePage(id: string) {
  await getRecord(id);
  await rm(pageDir(id), { recursive: true });
}

export async function readStage(id: string, stage: StageDef) {
  const file = join(pageDir(id), stage.file);
  if (!(await exists(file))) throw new NotFoundError(`no ${stage.file} yet: run the "${stage.name}" stage first`);
  return readFile(file, 'utf8');
}

export async function writeStage(id: string, stage: StageDef, content: string) {
  try {
    stage.validate?.(content);
  } catch (e) {
    throw new InvalidError(`${stage.file} is invalid: ${e instanceof Error ? e.message : e}`);
  }
  await writeFile(join(pageDir(id), stage.file), content);
}
