import type { z } from 'zod';

export interface Prompt {
  instructions: string;
  input: string;
  webSearch?: boolean;
}

/** What a stage gets when it runs. LLM calls are already bound to the stage's model and stream into the run's events. */
export interface Ctx {
  id: string;
  topic: string;
  lang: string;
  style?: string;
  outDir: string;
  /** Reads an earlier stage's file from disk, so edits made during review take effect. */
  read(stage: StageDef): Promise<string>;
  text(prompt: Prompt): Promise<string>;
  object<T extends z.ZodObject>(schema: T, prompt: Prompt): Promise<z.infer<T>>;
  emit(event: PipelineEvent): void;
  /** Stores the latest check result on the run record. */
  setChecks(errors: string[]): void;
}

export interface StageDef {
  name: string;
  /** Output file name inside out/<id>/. */
  file: string;
  /** Defaults to DEFAULT_MODEL. */
  model?: string;
  run(ctx: Ctx): Promise<string>;
  /** Throws if hand-edited content is invalid. */
  validate?(content: string): void;
}

export type StageStatus = 'pending' | 'running' | 'done' | 'failed';
export type RunStatus = 'running' | 'review' | 'passed' | 'flagged' | 'failed';

/** Persisted as out/<id>/run.json. */
export interface RunRecord {
  id: string;
  topic: string;
  lang: string;
  style?: string;
  /** Stop after each stage for review. */
  review: boolean;
  status: RunStatus;
  /** Keyed by stage name, in pipeline order. */
  stages: Record<string, StageStatus>;
  /** Latest check errors; null = not checked yet, [] = passed. */
  checks: string[] | null;
  /** Estimated USD across all runs of this page. */
  cost: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type PipelineEvent =
  | { type: 'record'; record: RunRecord }
  | { type: 'stage-start'; stage: string }
  | { type: 'delta'; stage: string; text: string }
  | { type: 'search'; stage: string; query: string }
  | { type: 'log'; stage: string; message: string };

export type Emit = (event: PipelineEvent) => void;
