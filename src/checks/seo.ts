import { parseHTML } from 'linkedom';

export function seoCheck(html: string, lang: string): string[] {
  const { document } = parseHTML(html);
  const errors: string[] = [];
  const text = (sel: string, attr?: string) => {
    const el = document.querySelector(sel);
    return ((attr ? el?.getAttribute(attr) : el?.textContent) ?? '').trim();
  };
  const maxLen = (label: string, value: string, max: number) => {
    if (!value) errors.push(`missing ${label}`);
    else if (value.length > max) errors.push(`${label} is ${value.length} chars, max ${max}`);
  };

  const h1s = document.querySelectorAll('h1').length;
  if (h1s !== 1) errors.push(`expected exactly one <h1>, found ${h1s}`);

  maxLen('<title>', text('title'), 60);
  maxLen('<meta name="description">', text('meta[name="description"]', 'content'), 160);

  const htmlLang = document.documentElement.getAttribute('lang') ?? '';
  if (htmlLang.toLowerCase().split('-')[0] !== lang.toLowerCase().split('-')[0])
    errors.push(`<html lang="${htmlLang}"> should be "${lang}"`);

  if (!document.querySelector('meta[name="viewport"]')) errors.push('missing <meta name="viewport">');
  if (document.querySelector('script[src]')) errors.push('external <script src> is not allowed; inline it or remove it');

  return errors;
}
