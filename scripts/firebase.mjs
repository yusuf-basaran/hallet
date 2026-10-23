import { readFile, writeFile, rename } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
const required = ['apiKey', 'authDomain', 'projectId', 'appId'];

export function validateFirebaseConfig(input, expectedProject) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Firebase Web yapılandırması bir JSON nesnesi olmalı.');
  }
  if ('private_key' in input || 'client_email' in input || input.type === 'service_account') {
    throw new Error('Servis hesabı bilgileri Web yapılandırması olarak kullanılamaz.');
  }
  for (const field of required) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      throw new Error(`Firebase Web yapılandırmasında ${field} eksik.`);
    }
  }
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(input.projectId)) {
    throw new Error('Firebase proje kimliği geçerli değil.');
  }
  if (input.projectId.startsWith('demo-')) {
    throw new Error('Canlı bağlantı için emülatör projesi kullanılamaz.');
  }
  if (expectedProject && input.projectId !== expectedProject) {
    throw new Error('Seçilen proje ile Web yapılandırmasının proje kimliği eşleşmiyor.');
  }
  if (!/^[a-z0-9.-]+$/i.test(input.authDomain) || !input.authDomain.includes('.')) {
    throw new Error('authDomain yalnızca alan adı içermeli; protokol veya port eklemeyin.');
  }
  if (!/^\d+:\d+:web:[a-z0-9]+$/i.test(input.appId)) {
    throw new Error('Web uygulamasının appId değeri geçerli değil.');
  }
  return Object.fromEntries(fields.filter(field => input[field] !== undefined).map(field => {
    if (typeof input[field] !== 'string') throw new Error(`${field} bir metin olmalı.`);
    return [field, input[field].trim()];
  }));
}

export async function applyFirebaseConfig(directory, input, expectedProject) {
  const config = validateFirebaseConfig(input, expectedProject);
  const configPath = join(directory, 'js', 'firebase-config.js');
  const rcPath = join(directory, '.firebaserc');
  const previous = await readFile(configPath, 'utf8');
  const pattern = /export const firebaseConfig = Object\.freeze\(\{[^}]*\}\);/g;
  if ([...previous.matchAll(pattern)].length !== 1) {
    throw new Error('firebase-config.js içinde tek bir yapılandırma bloğu bulunmalı.');
  }
  const next = previous.replace(pattern, () => `export const firebaseConfig = Object.freeze(${JSON.stringify(config, null, 2)});`);
  let rc = {};
  try { rc = JSON.parse(await readFile(rcPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!rc || typeof rc !== 'object' || Array.isArray(rc)) throw new Error('.firebaserc geçerli bir JSON nesnesi olmalı.');
  rc.projects = { ...rc.projects, default: config.projectId };
  const suffix = `.hallet-${process.pid}.tmp`;
  await writeFile(configPath + suffix, next, { mode: 0o600 });
  await writeFile(rcPath + suffix, `${JSON.stringify(rc, null, 2)}\n`, { mode: 0o600 });
  await rename(configPath + suffix, configPath);
  await rename(rcPath + suffix, rcPath);
  return config;
}

async function firebase(args) {
  const cli = require.resolve('firebase-tools/lib/bin/firebase.js');
  let result;
  try {
    result = await execute(process.execPath, [cli, ...args, '--json', '--non-interactive'], {
      cwd: root, maxBuffer: 4 * 1024 * 1024, env: process.env
    });
  } catch {
    throw new Error('Firebase komutu tamamlanamadı. Yetkili hesap oturumunu, proje erişimini ve etkin servisleri kontrol edin. Yerel giriş: npm run firebase:login');
  }
  let payload;
  try { payload = JSON.parse(result.stdout); }
  catch { throw new Error('Firebase CLI beklenen JSON yanıtını vermedi.'); }
  if (payload.status !== 'success') throw new Error('Firebase işlemi başarısız oldu. Hesap ve proje erişimini kontrol edin.');
  return payload.result;
}

async function checkDatabase(projectId) {
  const databases = await firebase(['firestore:databases:list', '--project', projectId]);
  const items = Array.isArray(databases) ? databases : databases?.databases;
  if (!Array.isArray(items)) throw new Error('Firestore veritabanı bilgileri alınamadı.');
  const database = items.find(item => item.name?.endsWith('/databases/(default)'));
  if (!database) throw new Error('Projede (default) Firestore veritabanı yok. Firebase Console üzerinden oluşturun.');
  if (database.type !== 'FIRESTORE_NATIVE') throw new Error('Bu uygulama Firestore Native veritabanı gerektiriyor.');
  if (database.databaseEdition === 'ENTERPRISE') {
    throw new Error('Enterprise veritabanı için Firebase SDK ve Rules uyumluluğu ayrıca doğrulanmalı.');
  }
}

async function main() {
  const { values } = parseArgs({ options: {
    project: { type: 'string' }, app: { type: 'string' }, config: { type: 'string' },
    deploy: { type: 'boolean', default: false }, help: { type: 'boolean', default: false }
  } });
  if (values.help) {
    console.log('npm run firebase:connect -- --project PROJE_KIMLIGI [--app WEB_APP_ID] [--deploy]');
    console.log('npm run firebase:connect -- --config /dosya/yolu/firebase-web.json [--deploy]');
    return;
  }
  if (!values.project && !values.config) throw new Error('--project veya --config belirtilmeli.');
  let config;
  if (values.config) {
    config = validateFirebaseConfig(JSON.parse(await readFile(resolve(values.config), 'utf8')), values.project);
  } else {
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(values.project) || values.project.startsWith('demo-')) {
      throw new Error('Geçerli bir canlı Firebase proje kimliği belirtin.');
    }
    const apps = await firebase(['apps:list', 'WEB', '--project', values.project]);
    if (!Array.isArray(apps) || !apps.length) throw new Error('Projede Web uygulaması yok. Firebase Console üzerinden HALLET Web uygulamasını ekleyin.');
    const app = values.app ? apps.find(item => item.appId === values.app) : apps.length === 1 ? apps[0] : null;
    if (!app) throw new Error('Birden fazla Web uygulaması varsa --app ile uygulama kimliğini belirtin.');
    const result = await firebase(['apps:sdkconfig', 'WEB', app.appId, '--project', values.project]);
    config = validateFirebaseConfig(result?.sdkConfig, values.project);
  }
  if (values.deploy) await checkDatabase(config.projectId);
  await applyFirebaseConfig(root, config, values.project);
  console.log(`Firebase Web yapılandırması ve .firebaserc güncellendi: ${config.projectId}`);
  if (values.deploy) {
    await firebase(['deploy', '--only', 'firestore:rules,firestore:indexes', '--project', config.projectId]);
    console.log('Firestore kuralları ve indeksleri yayımlandı. İndekslerin hazır duruma gelmesini bekleyin.');
  } else {
    console.log('Canlı Auth ve Firestore servisleri henüz doğrulanmadı.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
