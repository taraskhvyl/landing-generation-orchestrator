import type { StageDef } from '../types.ts';

export const research: StageDef = {
  name: 'research',
  file: 'research.md',
  run: ({ topic, text }) =>
    text({
      webSearch: true,
      instructions: `You research facts for an SEO landing page. Search the web thoroughly, in whichever languages give the best sources.
Write markdown notes in English with these sections:
- Audience: who searches this topic, their pains, objections and goals
- Search intent: what the searcher wants to do or learn
- Key facts and figures: specific, current, each with its source URL inline
- Competitors: what the top-ranking pages offer, and gaps none of them cover
- Questions people actually ask (People Also Ask, forums)
- Terminology the audience uses
Only verifiable information. Cite a URL for every number.`,
      input: `Topic: ${topic}`,
    }),
};
