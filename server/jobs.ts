// The single active job (one run at a time) and the event bus that SSE clients subscribe to.
import { EventEmitter } from 'node:events';
import type { Emit, PipelineEvent } from '../src/types.ts';

export class BusyError extends Error {}

const bus = new EventEmitter().setMaxListeners(0);
let active: { id: string; replay: PipelineEvent[] } | null = null;

export const activeId = () => active?.id ?? null;

/** Starts `work` in the background. Throws BusyError if another job is running. */
export function startJob(id: string, work: (emit: Emit) => Promise<unknown>) {
  if (active) throw new BusyError(`"${active.id}" is still running; wait for it to finish`);
  const job = { id, replay: [] as PipelineEvent[] };
  active = job;
  const emit: Emit = (e) => {
    // Record events carry full state; everything else is replayed to clients that connect mid-run.
    if (e.type !== 'record') job.replay.push(e);
    bus.emit(id, e);
  };
  work(emit)
    .catch((e) => console.error(`job ${id} crashed:`, e))
    .finally(() => (active = null));
}

/** Sends an event to a page's subscribers outside a job (e.g. after a settings change). */
export const publish: (id: string, e: PipelineEvent) => void = (id, e) => void bus.emit(id, e);

/** Subscribes to a page's events, first replaying what the running job already emitted. */
export function subscribe(id: string, listener: Emit) {
  if (active?.id === id) active.replay.forEach(listener);
  bus.on(id, listener);
  return () => void bus.off(id, listener);
}
