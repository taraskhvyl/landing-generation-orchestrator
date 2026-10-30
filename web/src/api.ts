import type { PipelineEvent, RunRecord, RunStatus, StageStatus } from '../../src/types.ts';

export type { PipelineEvent, RunRecord, RunStatus, StageStatus };
export interface StageInfo {
  name: string;
  file: string;
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isText = typeof body === 'string';
  const res = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': isText ? 'text/plain' : 'application/json' },
    body: body === undefined ? undefined : isText ? body : JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? res.statusText);
  if (res.status === 204) return undefined as T;
  return (res.headers.get('content-type')?.includes('json') ? res.json() : res.text()) as Promise<T>;
}

const page = (id: string) => `/api/pages/${encodeURIComponent(id)}`;

export const api = {
  list: () => req<{ pages: RunRecord[]; activeId: string | null; stages: StageInfo[] }>('GET', '/api/pages'),
  get: (id: string) => req<{ record: RunRecord; activeId: string | null; stages: StageInfo[] }>('GET', page(id)),
  create: (input: { topic: string; lang: string; style?: string; review: boolean }) => req<RunRecord>('POST', '/api/pages', input),
  update: (id: string, patch: { review: boolean }) => req<RunRecord>('PATCH', page(id), patch),
  remove: (id: string) => req<void>('DELETE', page(id)),
  duplicate: (id: string, style?: string) => req<RunRecord>('POST', `${page(id)}/duplicate`, { style }),
  run: (id: string, from?: string) => req<void>('POST', `${page(id)}/run`, { from }),
  check: (id: string) => req<void>('POST', `${page(id)}/check`, {}),
  fix: (id: string) => req<void>('POST', `${page(id)}/fix`, {}),
  readFile: (id: string, stage: string) => req<string>('GET', `${page(id)}/files/${stage}`),
  writeFile: (id: string, stage: string, content: string) => req<void>('PUT', `${page(id)}/files/${stage}`, content),
  eventsUrl: (id: string) => `${page(id)}/events`,
  fileUrl: (id: string, file: string, version = '') => `/out/${encodeURIComponent(id)}/${file}?v=${encodeURIComponent(version)}`,
};
