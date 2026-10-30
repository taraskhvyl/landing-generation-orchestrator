import type { StageDef } from '../types.ts';
import { copy } from './copy.ts';
import { design } from './design.ts';
import { html } from './html.ts';
import { outline } from './outline.ts';
import { research } from './research.ts';

/** Pipeline order. The only place a new stage must be registered. */
export const STAGES: StageDef[] = [research, outline, copy, design, html];
