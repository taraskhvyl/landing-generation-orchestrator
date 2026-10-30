export const DEFAULT_MODEL = 'gpt-6.1-sol';
export const OUT_DIR = 'out';

// USD per 1M tokens [input, output], OpenAI pricing 2026-10.
export const PRICES: Record<string, [number, number]> = { 'gpt-6.1-sol': [2, 10], 'gpt-6-astra': [10, 50] };
export const WEB_SEARCH_PRICE = 0.01;
