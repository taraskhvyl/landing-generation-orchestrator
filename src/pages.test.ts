import assert from 'node:assert/strict';
import { pageDir, slugify } from './pages.ts';

assert.equal(slugify('Best CRM for Dentists!'), 'best-crm-for-dentists');
assert.equal(slugify('CRM для стоматологів'), 'crm-для-стоматологів');
assert.equal(slugify('!!!'), 'page');
// Regression: cutting at 80 chars right after a separator used to leave a trailing "-" (an invalid id).
const long = slugify('зроби лендінг для продажу шарфа https://www.zara.com/ua/en/faux-fur-fringed-scarf-p04219202.html');
assert.ok(!long.endsWith('-') && [...long].length <= 80, long);
assert.doesNotThrow(() => pageDir(long));
assert.equal(pageDir('crm-для-стоматологів-2'), 'out/crm-для-стоматологів-2');
for (const bad of ['../etc', 'a/b', '', 'a--b', '-a', 'a.json'])
  assert.throws(() => pageDir(bad), /invalid page id/, `should reject "${bad}"`);

console.log('pages.test.ts: all passed');
