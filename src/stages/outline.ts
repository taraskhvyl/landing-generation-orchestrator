import { z } from 'zod';
import type { StageDef } from '../types.ts';
import { NO_FABRICATION, inLanguage } from './rules.ts';
import { research } from './research.ts';

const Outline = z.object({
  title: z.string().describe('SEO <title>, max 60 characters'),
  metaDescription: z.string().describe('max 160 characters'),
  primaryKeyword: z.string(),
  searchIntent: z.string(),
  audience: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      heading: z.string(),
      goal: z.string(),
      keyPoints: z.array(z.string()).describe('specific facts from the research this section must use'),
    }),
  ),
  cta: z.object({ text: z.string(), goal: z.string() }),
});

export const outline: StageDef = {
  name: 'outline',
  file: 'outline.json',
  validate: (content) => {
    const result = Outline.safeParse(JSON.parse(content));
    if (!result.success) throw new Error(z.prettifyError(result.error));
  },
  run: async ({ topic, lang, read, object }) => {
    const result = await object(Outline, {
      instructions: `You plan high-converting SEO landing pages. Match the search intent with one primary keyword.
Choose and order the sections that fit this topic (e.g. hero, problem, solution, benefits, how it works, comparison, FAQ, final CTA).
Every section must be built on specific facts from the research, never generic filler.
title max 60 characters, metaDescription max 160. ${inLanguage(lang)}
${NO_FABRICATION}`,
      input: `Topic: ${topic}\n\nResearch:\n${await read(research)}`,
    });
    return JSON.stringify(result, null, 2);
  },
};
