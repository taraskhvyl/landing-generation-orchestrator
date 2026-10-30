import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { ResponseStreamParams } from 'openai/lib/responses/ResponseStream';
import type { z } from 'zod';
import { PRICES, WEB_SEARCH_PRICE } from './config.ts';
import type { Ctx, Prompt } from './types.ts';

// Lazy so the server starts (and shows a proper error) without OPENAI_API_KEY.
let client: OpenAI | undefined;
const openai = () => (client ??= new OpenAI());

export interface LlmHooks {
  onCost(usd: number): void;
  onDelta(text: string): void;
  onSearch(query: string): void;
}

/** LLM calls bound to one model, streaming text deltas and web searches into `hooks`. */
export function llmFor(model: string, name: string, hooks: LlmHooks): Pick<Ctx, 'text' | 'object'> {
  async function stream(params: ResponseStreamParams) {
    const s = openai().responses.stream(params);
    for await (const e of s) {
      if (e.type === 'response.output_text.delta') hooks.onDelta(e.delta);
      if (e.type === 'response.output_item.done' && e.item.type === 'web_search_call' && e.item.action.type === 'search') {
        const { queries, query } = e.item.action;
        for (const q of queries ?? (query ? [query] : [])) hooks.onSearch(q);
      }
    }
    const res = await s.finalResponse();
    const [inp, out] = PRICES[model] ?? [0, 0];
    const searches = res.output.filter((o) => o.type === 'web_search_call').length;
    hooks.onCost(((res.usage?.input_tokens ?? 0) * inp + (res.usage?.output_tokens ?? 0) * out) / 1e6 + searches * WEB_SEARCH_PRICE);
    return res;
  }

  return {
    async text({ instructions, input, webSearch }: Prompt) {
      const res = await stream({ model, instructions, input, ...(webSearch && { tools: [{ type: 'web_search' }] }) });
      return res.output_text;
    },
    async object<T extends z.ZodObject>(schema: T, { instructions, input }: Prompt) {
      const res = await stream({ model, instructions, input, text: { format: zodTextFormat(schema, name) } });
      const parsed = schema.safeParse(JSON.parse(res.output_text || 'null'));
      if (!parsed.success) throw new Error(`${name}: model output does not match schema: ${parsed.error.message}`);
      return parsed.data as z.infer<T>;
    },
  };
}
