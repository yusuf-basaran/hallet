import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createLeadService } from '../js/lead-service.js';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, runTransaction, Timestamp, serverTimestamp, increment } from 'firebase/firestore';

let environment;
const jobA = 'aaaaaaaaaaaaaaaaaaaa';
const jobB = 'bbbbbbbbbbbbbbbbbbbb';
const baseUser = (role = 'pro', extra = {}) => ({
  fullName: 'Kemal Usta', phone: '905338123442', role, city: 'Lefkoşa',
  categories: role === 'pro' ? ['ac-repair'] : [], bio: 'Klima bakım ve servis işleri.',
  credits: role === 'pro' ? 3 : 0, isVerified: false, isFeatured: false,
  featuredUntil: null, ratingAvg: 0, reviewCount: 0, whatsappClicks: 0,
  createdAt: Timestamp.fromMillis(1000), ...extra
});
const baseJob = (extra = {}) => ({
  customerName: 'Hasan K.', customerPhone: '0533 8** ** 42',
  category: 'ac-repair', city: 'Lefkoşa', district: 'Gönyeli',
  details: { description: 'Salondaki klimanın bakım ve arıza kontrolü yapılacak.' },
  urgency: 'bu_hafta', status: 'open', unlockedBy: [], createdAt: Timestamp.fromMillis(1000), ...extra
});
const account = uid => environment.authenticatedContext(uid).firestore();
const anonymous = () => environment.unauthenticatedContext().firestore();

before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-hallet', firestore: {
    host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8')
  } });
});
after(async () => { await environment?.cleanup(); });
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users', 'pro'), baseUser()),
      setDoc(doc(db, 'users', 'other'), baseUser('pro', { city: 'Girne' })),
      setDoc(doc(db, 'users', 'customer'), baseUser('customer')),
      setDoc(doc(db, 'users', 'admin'), baseUser('admin')),
      setDoc(doc(db, 'job_requests', jobA), baseJob()),
      setDoc(doc(db, 'job_requests', jobB), baseJob()),
      ...[jobA, jobB].map(id => setDoc(doc(db, 'job_requests', id, 'private', 'contact'), { customerUid: 'customer', customerPhone: '905338123442' }))
    ]);
  });
});

async function purchase(db, uid, jobId) {
  return createLeadService({ db, doc, getDoc, runTransaction, serverTimestamp })(uid, jobId);
}

test('Rehber anonim okunur; müşteri, admin ve özel alt belgeler okunamaz', async () => {
  const db = anonymous();
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('role', '==', 'pro'))));
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(getDoc(doc(db, 'users', 'customer')));
  await assertFails(getDoc(doc(db, 'users', 'admin')));
  await assertFails(getDoc(doc(db, 'job_requests', jobA)));
  await assertFails(getDoc(doc(db, 'job_requests', jobA, 'private', 'contact')));
});

test('Usta ilçe ve kategoriye uygun açık talepleri sorgulayabilir', async () => {
  const db = account('pro');
  const snapshot = await assertSucceeds(getDocs(query(collection(db, 'job_requests'), where('status', '==', 'open'), where('city', '==', 'Lefkoşa'), where('category', 'in', ['ac-repair']))));
  assert.equal(snapshot.size, 2);
  assert.equal(snapshot.docs[0].data().customerPhone, '0533 8** ** 42');
  await assertFails(getDocs(collection(db, 'job_requests')));
  await assertFails(getDoc(doc(account('other'), 'job_requests', jobA)));
  await assertFails(getDoc(doc(db, 'job_requests', jobA, 'private', 'contact')));
});

test('Talebin sahibi kendi gerçek telefonunu okuyabilir', async () => {
  const result = await assertSucceeds(getDoc(doc(account('customer'), 'job_requests', jobA, 'private', 'contact')));
  assert.equal(result.data().customerPhone, '905338123442');
});

test('Yeni usta yalnızca 3 krediyle ve yetkisiz rozetler kapalı olarak kaydolur', async () => {
  const db = account('new-pro');
  await assertSucceeds(getDoc(doc(db, 'users', 'new-pro')));
  await assertSucceeds(setDoc(doc(db, 'users', 'new-pro'), baseUser('pro', { createdAt: serverTimestamp() })));
  await assertFails(setDoc(doc(account('bad-pro'), 'users', 'bad-pro'), baseUser('pro', { credits: 100, createdAt: serverTimestamp() })));
  await assertFails(setDoc(doc(account('bad-admin'), 'users', 'bad-admin'), baseUser('admin', { createdAt: serverTimestamp() })));
  await assertFails(setDoc(doc(account('bad-vip'), 'users', 'bad-vip'), baseUser('pro', { isVerified: true, createdAt: serverTimestamp() })));
});

test('Profil güncellemesi rol, kredi ve rozetleri değiştiremez; şema korunur', async () => {
  const db = account('pro');
  await assertSucceeds(updateDoc(doc(db, 'users', 'pro'), { bio: 'Gönyeli ve çevresinde klima bakımı.' }));
  for (const change of [{ role: 'admin' }, { credits: 100 }, { isVerified: true }, { bio: 'x'.repeat(1001) }, { categories: ['bad'] }, { extraData: true }, { createdAt: Timestamp.now() }]) {
    await assertFails(updateDoc(doc(db, 'users', 'pro'), change));
  }
  await assertFails(updateDoc(doc(account('other'), 'users', 'pro'), { fullName: 'Başka kişi' }));
  await assertFails(deleteDoc(doc(db, 'users', 'pro')));
});

test('Kredi harcanmadan telefon açma veya tek taraflı kredi azaltma reddedilir', async () => {
  const db = account('pro');
  await assertFails(updateDoc(doc(db, 'job_requests', jobA), { unlockedBy: ['pro'] }));
  await assertFails(updateDoc(doc(db, 'users', 'pro'), { credits: 2 }));
  await assertFails(setDoc(doc(db, 'users', 'pro', 'private', 'unlock'), { jobId: jobA, createdAt: serverTimestamp() }));
});

test('Atomik açma 1 kredi düşer, telefon açılır; tekrar açma ücretsizdir', async () => {
  const db = account('pro');
  await assertSucceeds(purchase(db, 'pro', jobA));
  assert.equal((await getDoc(doc(db, 'users', 'pro'))).data().credits, 2);
  assert.equal((await assertSucceeds(getDoc(doc(db, 'job_requests', jobA, 'private', 'contact')))).data().customerPhone, '905338123442');
  await assertSucceeds(purchase(db, 'pro', jobA));
  assert.equal((await getDoc(doc(db, 'users', 'pro'))).data().credits, 2);
  const opened = await assertSucceeds(getDocs(query(collection(db, 'job_requests'), where('unlockedBy', 'array-contains', 'pro'))));
  assert.equal(opened.size, 1);
});

test('İki talebi tek krediye açmak reddedilir', async () => {
  const db = account('pro');
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', 'pro'), { credits: 2 });
  batch.update(doc(db, 'job_requests', jobA), { unlockedBy: ['pro'] });
  batch.update(doc(db, 'job_requests', jobB), { unlockedBy: ['pro'] });
  batch.set(doc(db, 'users', 'pro', 'private', 'unlock'), { jobId: jobA, createdAt: serverTimestamp() });
  await assertFails(batch.commit());
  assert.equal((await getDoc(doc(db, 'users', 'pro'))).data().credits, 3);
});

test('Eşzamanlı aynı talep açılışlarında yalnızca bir kredi kullanılır', async () => {
  const db = account('pro');
  await Promise.all([purchase(db, 'pro', jobA), purchase(db, 'pro', jobA)]);
  assert.equal((await getDoc(doc(db, 'users', 'pro'))).data().credits, 2);
});

test('Son kredi için iki farklı eşzamanlı talepten biri açılır', async () => {
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'users', 'pro'), { credits: 1 }));
  const db = account('pro');
  const results = await Promise.allSettled([purchase(db, 'pro', jobA), purchase(db, 'pro', jobB)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await getDoc(doc(db, 'users', 'pro'))).data().credits, 0);
});

test('Yanlış bölge, yanlış kategori, kapalı talep ve sıfır kredi erişimi reddeder', async () => {
  await assertFails(purchase(account('other'), 'other', jobA));
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'job_requests', jobA), { status: 'closed' });
    await updateDoc(doc(context.firestore(), 'job_requests', jobB), { category: 'cleaning' });
  });
  await assert.rejects(purchase(account('pro'), 'pro', jobA));
  await assertFails(purchase(account('pro'), 'pro', jobB));
});

test('İletişim belgesi ve talep birlikte oluşturulur; gerçek numara talebe yazılamaz', async () => {
  const db = account('customer');
  const id = 'cccccccccccccccccccc';
  const batch = writeBatch(db);
  batch.set(doc(db, 'job_requests', id), baseJob({ createdAt: serverTimestamp() }));
  batch.set(doc(db, 'job_requests', id, 'private', 'contact'), { customerPhone: '905338123442', customerUid: 'customer' });
  await assertSucceeds(batch.commit());
  await assertFails(setDoc(doc(db, 'job_requests', 'dddddddddddddddddddd'), baseJob({ createdAt: serverTimestamp() })));
  await assertFails(updateDoc(doc(db, 'job_requests', id, 'private', 'contact'), { customerUid: 'pro' }));
  const raw = writeBatch(db);
  raw.set(doc(db, 'job_requests', 'eeeeeeeeeeeeeeeeeeee'), baseJob({ customerPhone: '905338123442', createdAt: serverTimestamp() }));
  raw.set(doc(db, 'job_requests', 'eeeeeeeeeeeeeeeeeeee', 'private', 'contact'), { customerPhone: '905338123442', customerUid: 'customer' });
  await assertFails(raw.commit());
});

test('Sahiplik, zaman damgası, veri tipi ve alt belge fazlalıkları korunur', async () => {
  const db = account('customer');
  for (const contact of [
    { customerPhone: '905338123442', customerUid: 'other' },
    { customerPhone: 123, customerUid: 'customer' },
    { customerPhone: '905338123442', customerUid: 'customer', extra: true }
  ]) {
    const id = doc(collection(db, 'job_requests')).id;
    const batch = writeBatch(db);
    batch.set(doc(db, 'job_requests', id), baseJob({ createdAt: serverTimestamp() }));
    batch.set(doc(db, 'job_requests', id, 'private', 'contact'), contact);
    await assertFails(batch.commit());
  }
  const id = doc(collection(db, 'job_requests')).id;
  const batch = writeBatch(db);
  batch.set(doc(db, 'job_requests', id), baseJob({ details: { description: 'x'.repeat(2001) }, createdAt: serverTimestamp() }));
  batch.set(doc(db, 'job_requests', id, 'private', 'contact'), { customerPhone: '905338123442', customerUid: 'customer' });
  await assertFails(batch.commit());
});

test('Admin kredi ekleyebilir ve VIP ayarlayabilir; diğer kullanıcılar yapamaz', async () => {
  const db = account('admin');
  await assertSucceeds(updateDoc(doc(db, 'users', 'pro'), { credits: 13 }));
  await assertSucceeds(updateDoc(doc(db, 'users', 'pro'), { isFeatured: true, featuredUntil: Timestamp.fromMillis(Date.now() + 86400000), isVerified: true }));
  await assertFails(updateDoc(doc(db, 'users', 'pro'), { credits: 2014 }));
  await assertFails(updateDoc(doc(account('other'), 'users', 'pro'), { credits: 14 }));
  await assertSucceeds(updateDoc(doc(db, 'job_requests', jobA), { status: 'closed' }));
});

test('WhatsApp sayacı yalnızca +1 güncellenir; eşlik eden alan değişikliği reddedilir', async () => {
  const db = anonymous();
  await assertSucceeds(updateDoc(doc(db, 'users', 'pro'), { whatsappClicks: increment(1) }));
  await assertFails(updateDoc(doc(db, 'users', 'pro'), { whatsappClicks: 10 }));
  await assertFails(updateDoc(doc(db, 'users', 'pro'), { whatsappClicks: 2, credits: 100 }));
  await assertFails(updateDoc(doc(db, 'users', 'customer'), { whatsappClicks: 1 }));
});

test('Yorumlar onaysız oluşturulur; yalnızca admin onay verir; aynı usta için ikinci yorum yazılamaz', async () => {
  const db = account('customer');
  const review = { proId: 'pro', customerName: 'Kemal Usta', rating: 5, comment: 'Belirtilen saatte gelip klima bakımını tamamladı.', isApproved: false, createdAt: serverTimestamp() };
  await assertSucceeds(setDoc(doc(db, 'reviews', 'customer_pro'), review));
  await assertFails(getDoc(doc(anonymous(), 'reviews', 'customer_pro')));
  await assertFails(updateDoc(doc(db, 'reviews', 'customer_pro'), { isApproved: true }));
  await assertFails(setDoc(doc(db, 'reviews', 'customer_pro'), review));
  await assertFails(setDoc(doc(db, 'reviews', 'fake'), { ...review, isApproved: true }));
  await assertSucceeds(updateDoc(doc(account('admin'), 'reviews', 'customer_pro'), { isApproved: true }));
  await assertSucceeds(getDocs(query(collection(anonymous(), 'reviews'), where('proId', '==', 'pro'), where('isApproved', '==', true))));
});
