import type { StageDef } from '../types.ts';
import { outline } from './outline.ts';
import { research } from './research.ts';
import { NO_FABRICATION, inLanguage } from './rules.ts';

export const copy: StageDef = {
  name: 'copy',
  file: 'copy.md',
  run: async ({ lang, read, text }) =>
    text({
      instructions: `You are a senior conversion copywriter. Write the final copy for every section of the outline. ${inLanguage(lang)}
Concrete and specific: use the research's numbers and terminology. Benefit-led headings. One primary CTA, repeated.
FAQ answers 40–60 words each. Avoid clichés (unlock, elevate, seamless, revolutionize, game-changer).
${NO_FABRICATION}
Output markdown: one "## <section id>" heading per section, then its copy.`,
      input: `Outline:\n${await read(outline)}\n\nResearch:\n${await read(research)}`,
    }),
};
