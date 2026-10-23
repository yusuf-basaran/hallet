import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateFirebaseConfig, applyFirebaseConfig } from '../scripts/firebase.mjs';

const config = {
  apiKey: 'test-web-api-key', authDomain: 'hallet-test.firebaseapp.com',
  projectId: 'hallet-test', appId: '1:123456:web:abcdef',
  storageBucket: 'hallet-test.firebasestorage.app', messagingSenderId: '123456'
};

test('Yanlış proje ve servis hesabı dosyası Web yapılandırmasına yazılmaz', () => {
  assert.throws(() => validateFirebaseConfig(config, 'baska-proje'));
  assert.throws(() => validateFirebaseConfig({ ...config, private_key: 'özel anahtar' }));
  assert.throws(() => validateFirebaseConfig({ ...config, client_email: 'service@example.invalid' }));
  assert.throws(() => validateFirebaseConfig({ ...config, type: 'service_account' }));
  assert.throws(() => validateFirebaseConfig({ ...config, apiKey: '' }));
  assert.throws(() => validateFirebaseConfig({ ...config, projectId: 'demo-hallet' }));
  assert.throws(() => validateFirebaseConfig({ ...config, authDomain: 'https://example.invalid' }));
  assert.throws(() => validateFirebaseConfig({ ...config, appId: 'android-app' }));
});

test('Bağlantı dosyası güncellenir; yardımcı fonksiyonlar ve mevcut proje takma adları korunur', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hallet-config-'));
  try {
    await mkdir(join(directory, 'js'));
    const source = await readFile(new URL('../js/firebase-config.js', import.meta.url), 'utf8');
    await writeFile(join(directory, 'js/firebase-config.js'), source);
    await writeFile(join(directory, '.firebaserc'), JSON.stringify({ projects: { staging: 'hallet-staging' }, targets: {} }));
    await applyFirebaseConfig(directory, config, config.projectId);
    const updated = await readFile(join(directory, 'js/firebase-config.js'), 'utf8');
    assert.ok(updated.includes('"projectId": "hallet-test"'));
    assert.equal(updated.slice(updated.indexOf('export function normalizePhone')), source.slice(source.indexOf('export function normalizePhone')));
    const rc = JSON.parse(await readFile(join(directory, '.firebaserc'), 'utf8'));
    assert.equal(rc.projects.default, config.projectId);
    assert.equal(rc.projects.staging, 'hallet-staging');
    assert.deepEqual(rc.targets, {});
    await applyFirebaseConfig(directory, config, config.projectId);
    assert.equal(await readFile(join(directory, 'js/firebase-config.js'), 'utf8'), updated);
    await assert.rejects(applyFirebaseConfig(directory, config, 'baska-proje'));
    assert.equal(await readFile(join(directory, 'js/firebase-config.js'), 'utf8'), updated);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
