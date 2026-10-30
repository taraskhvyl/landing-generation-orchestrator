import type { StageDef } from '../types.ts';
import { outline } from './outline.ts';

export const design: StageDef = {
  name: 'design',
  file: 'design.md',
  run: async ({ topic, style, read, text }) =>
    text({
      instructions: `You are an art director. Create a distinctive visual direction for this one landing page that fits its topic and audience.
Avoid the generic SaaS look (purple gradients, centered hero with blob shapes) unless the topic truly calls for it.
Output markdown with:
- Mood: 3 words and a one-line concept
- Palette: hex values for background, surface, text, muted text, primary, accent. Text on background and on primary buttons must pass WCAG AA (4.5:1).
- Typography: at most 2 Google Fonts families (or system stacks), with sizes and weights
- Layout: the treatment for each section in the outline, mobile-first
- Decoration: CSS/SVG-only motifs (no images, no photos)
${style ? `The client asked for this style: ${style}` : ''}`,
      input: `Topic: ${topic}\n\nOutline:\n${await read(outline)}`,
    }),
};
