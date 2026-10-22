import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const jsFiles = (await readdir('js')).filter(file => file.endsWith('.js'));
for (const file of jsFiles) {
  const checked = spawnSync(process.execPath, ['--check', `js/${file}`], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
}
for (const file of ['vercel.json', 'firebase.json', 'firestore.indexes.json']) JSON.parse(await readFile(file, 'utf8'));
const store = new Map();
globalThis.window = { localStorage: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) } };
globalThis.Element = class {};
globalThis.document = { documentElement: {}, querySelectorAll: () => [], dispatchEvent: () => {} };
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
const i18n = await import('../js/i18n.js');
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => typeof item === 'string' ? [[prefix + key, item]] : flatten(item, `${prefix}${key}.`));
const tr = new Map(flatten(i18n.dictionary.tr));
for (const language of i18n.SUPPORTED_LANGUAGES) {
  const dictionary = new Map(flatten(i18n.dictionary[language]));
  assert.deepEqual([...dictionary.keys()].sort(), [...tr.keys()].sort());
  for (const [key, value] of dictionary) {
    assert.ok(value.trim(), `${language}:${key}`);
    assert.deepEqual((value.match(/\{\w+\}/g) || []).sort(), (tr.get(key).match(/\{\w+\}/g) || []).sort(), key);
  }
  assert.equal(i18n.setLanguage(language.toUpperCase()), true);
  assert.equal(document.documentElement.lang, language);
  assert.equal(i18n.t('nav.home'), dictionary.get('nav.home'));
}
for (const page of ['index.html', 'dashboard.html']) {
  const html = await readFile(page, 'utf8');
  for (const [, key] of html.matchAll(/data-i18n(?:-placeholder|-title|-aria-label|-content)?="([^"]+)"/g)) assert.ok(tr.has(key), `${page}: ${key}`);
}
const config = await readFile('js/firebase-config.js', 'utf8');
const helperSource = config.slice(config.indexOf('export function normalizePhone'), config.lastIndexOf('export {'));
const phone = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString('base64')}`);
for (const value of ['0533 812 34 42', '+90 533 812 34 42', '00905338123442', '5338123442']) assert.equal(phone.normalizePhone(value), '905338123442');
assert.equal(phone.normalizePhone('0548 812 34 42'), '905488123442');
for (const value of ['0532 812 34 42', '0533 712 34 42', '+90+5338123442', 'hello', '']) assert.equal(phone.normalizePhone(value), '');
assert.equal(phone.maskPhone('905338123442'), '0533 8** ** 42');
assert.equal(phone.formatPhone('905338123442'), '0533 812 34 42');
const css = await readFile('css/style.css', 'utf8');
assert.ok(css.startsWith(':root {'));
assert.deepEqual(css.match(/#[\da-fA-F]{6}\b/g), ['#0F766E','#115E59','#142B3B','#FFB454','#F7FAFC','#FFFFFF','#172B36','#526571','#DFE7EB','#15803D','#DC2626']);
assert.equal(/gradient\(|backdrop-filter|999px|box-shadow|text-shadow/.test(css), false);
for (const file of ['index.html', 'dashboard.html', ...jsFiles.map(file => `js/${file}`), 'css/style.css']) assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(await readFile(file, 'utf8')), false, file);
console.log(`${jsFiles.length} JavaScript dosyası, JSON dosyaları, ${tr.size} × 3 çeviri, telefon ve tasarım kontrolleri geçti.`);
