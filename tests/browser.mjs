import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const root = process.cwd();
const server = createServer(async (request, response) => {
  let path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/') path = '/index.html';
  if (path === '/dashboard') path = '/dashboard.html';
  if (!/^\/(index\.html|dashboard\.html|favicon\.svg|(?:js|css)\/[\w.-]+)$/.test(path)) { response.writeHead(404); response.end(); return; }
  try {
    const content = await readFile(join(root, path));
    response.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' }[extname(path)]);
    response.end(content);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const errors = [];
const contexts = [];
let environment;
async function context(live = false) {
  const value = await browser.newContext({ ignoreHTTPSErrors: true });
  contexts.push(value);
  value.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  if (live) {
    await value.route('**/js/firebase-config.js', async route => {
      let code = await readFile('js/firebase-config.js', 'utf8');
      code = code.replace('apiKey: ""', 'apiKey: "demo-api-key"').replace('authDomain: ""', 'authDomain: "localhost"').replace('projectId: ""', 'projectId: "demo-hallet"').replace('appId: ""', 'appId: "1:123:web:hallet"');
      code += '\nimport { connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";\nimport { connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";\nconnectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });\nconnectFirestoreEmulator(db, "127.0.0.1", 8080);';
      await route.fulfill({ contentType: 'text/javascript', body: code });
    });
  }
  return value;
}
async function visible(page, selector) { await page.locator(selector).first().waitFor({state:'visible'}); }
async function text(page, selector, expected) {
  await page.waitForFunction(({selector, expected}) => document.querySelector(selector)?.textContent.includes(expected), {selector, expected});
}
async function register(page, {role, name, email}) {
  await page.locator('[data-open-auth="register"]').first().click();
  await page.locator('#auth-role').selectOption(role);
  await page.locator('#auth-name').fill(name);
  await page.locator('#auth-phone').fill('0533 812 34 42');
  if (role === 'pro') {
    await page.locator('#auth-city').selectOption('Lefkoşa');
    await page.locator('#auth-categories input[value="ac-repair"]').check();
    await page.locator('#auth-bio').fill('Gönyeli ve Lefkoşa bölgesinde klima bakım ve tamir servisi.');
  }
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill('Hallet-test-1234');
  await page.locator('#auth-submit').click();
  await page.waitForFunction(() => !document.querySelector('#auth-dialog').open);
  return page.evaluate(async () => (await import('/js/firebase-config.js')).auth.currentUser.uid);
}
try {
  await mkdir('test-results', {recursive:true});
  const demo = await context();
  const page = await demo.newPage();
  await page.goto(origin);
  await visible(page, '.pro-card');
  assert.equal(await page.locator('.pro-card').count(), 6);
  assert.equal(await page.locator('.btn-whatsapp:disabled').count(), 6);
  await page.locator('#filter-city').selectOption('Girne');
  assert.equal(await page.locator('.pro-card').count(), 1);
  assert.ok((await page.locator('.pro-card h3').textContent()).includes('Alsancak'));
  await page.locator('[data-language="en"]').click();
  await text(page, 'h1', 'Get the job done');
  assert.equal(await page.locator('#filter-city').inputValue(), 'Girne');
  await page.reload();
  await text(page, 'h1', 'Get the job done');
  await page.locator('[data-language="ru"]').click();
  await text(page, 'h1', 'Доверьте');
  await page.locator('[data-language="tr"]').click();
  await page.locator('#filter-category').selectOption('moving');
  await visible(page, '#directory-empty');
  await page.locator('#clear-filters').click();
  assert.equal(await page.locator('.pro-card').count(), 6);
  await page.locator('[data-open-request]').first().click();
  await page.locator('#wizard-next').click();
  await text(page, '#request-message', 'hizmet');
  await page.locator('#request-category').selectOption('ac-repair');
  await page.locator('#request-details').fill('Klima soğutmuyor. Filtre temizliği ve arıza kontrolü gerekiyor.');
  await page.locator('#wizard-next').click();
  await page.locator('[name="urgency"][value="acil"]').check();
  await page.locator('#wizard-next').click();
  await page.locator('#request-city').selectOption('Lefkoşa');
  await page.locator('#request-district').fill('Gönyeli');
  await page.locator('#wizard-next').click();
  await page.locator('#request-name').fill('Hasan K.');
  await page.locator('#request-phone').fill('0533 812 34 42');
  await page.locator('#request-consent').check();
  await page.locator('#wizard-next').click();
  await text(page, '#request-message', 'henüz kullanıma');
  await page.keyboard.press('Escape');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Yatay taşma: ${width}`);
    if (width === 390 || width === 1440) await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true});
  }
  await page.goto(`${origin}/dashboard`);
  await visible(page, '#dashboard-guest');
  await page.locator('[data-open-auth="login"]').first().click();
  await page.locator('#auth-email').fill('user@example.test');
  await page.locator('#auth-password').fill('Hallet-test-1234');
  await page.locator('#auth-submit').click();
  await text(page, '#auth-message', 'henüz kullanıma');
  await page.keyboard.press('Escape');
  console.log('Örnek görünüm: filtreler, TR/EN/RU, kalıcı dil tercihi, sihirbaz doğrulaması ve 320–1440 px ekranlar geçti.');

  environment = await initializeTestEnvironment({projectId:'demo-hallet',firestore:{host:'127.0.0.1',port:8080}});
  await environment.clearFirestore();
  const proContext = await context(true);
  const proPage = await proContext.newPage();
  await proPage.goto(`${origin}/dashboard`);
  const proUid = await register(proPage, {role:'pro', name:'Kemal Usta', email:'kemal@example.test'});
  await text(proPage, '#stat-credits', '3');
  const customerContext = await context(true);
  const customerPage = await customerContext.newPage();
  await customerPage.goto(origin);
  const customerUid = await register(customerPage, {role:'customer', name:'Hasan K.', email:'hasan@example.test'});
  await customerPage.locator('[data-open-request]').first().click();
  await customerPage.locator('#request-category').selectOption('ac-repair');
  await customerPage.locator('#request-details').fill('Salondaki klima soğutmuyor. Bakım ve arıza kontrolü yapılacak.');
  await customerPage.locator('#wizard-next').click();
  await customerPage.locator('#wizard-next').click();
  await customerPage.locator('#request-city').selectOption('Lefkoşa');
  await customerPage.locator('#request-district').fill('Gönyeli');
  await customerPage.locator('#wizard-next').click();
  await customerPage.locator('#request-name').fill('Hasan K.');
  await customerPage.locator('#request-phone').fill('0533 812 34 42');
  await customerPage.locator('#request-consent').check();
  await customerPage.locator('#wizard-next').click();
  await visible(customerPage, '#request-success');
  await visible(proPage, '#matching-requests .lead-card');
  await text(proPage, '#matching-requests .phone-number', '0533 8** ** 42');
  await proPage.locator('#matching-requests .btn-primary').click();
  await proPage.locator('#confirm-unlock').click();
  await text(proPage, '#stat-credits', '2');
  await text(proPage, '#matching-requests .phone-number', '0533 812 34 42');
  await proPage.locator('#tab-unlocked').click();
  await visible(proPage, '#unlocked-requests .lead-card');
  await proPage.screenshot({path:'test-results/pro-dashboard.png',fullPage:true});
  await customerPage.keyboard.press('Escape');
  await customerPage.reload();
  await visible(customerPage, '.pro-card');
  await customerPage.evaluate(() => { window.open = url => { window.__contactUrl = url; return null; }; });
  await customerPage.locator('.btn-whatsapp').click();
  const contactUrl = await customerPage.evaluate(() => window.__contactUrl);
  assert.ok(contactUrl.startsWith('https://wa.me/905338123442'));
  assert.ok(new URL(contactUrl).searchParams.get('text').includes('127.0.0.1'));
  await text(proPage, '#stat-clicks', '1');
  await customerPage.locator('.rating .text-button').click();
  await visible(customerPage, '#reviews-dialog');
  await customerPage.locator('#review-comment').fill('Belirtilen saatte gelip klimanın bakımını yaptı. İşinden memnun kaldık.');
  await customerPage.locator('#review-submit').click();
  await text(customerPage, '#review-message', 'Yorumunuz alındı');
  await environment.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    const user=await getDoc(doc(db,'users',customerUid));
    assert.equal(user.data().role,'customer');
    await updateDoc(doc(db,'users',customerUid), {role:'admin'});
  });
  await customerPage.goto(`${origin}/dashboard`);
  await visible(customerPage, '#tab-admin');
  await customerPage.locator('#tab-admin').click();
  await visible(customerPage, '#admin-pros tr');
  await customerPage.locator('.admin-credit-form input').fill('5');
  await customerPage.locator('.admin-credit-form button').click();
  await text(proPage, '#stat-credits', '7');
  await text(customerPage, '#admin-pros tr td:nth-child(2)', '7');
  await customerPage.locator('[name="isFeatured"]').check();
  const expiry = new Date(Date.now()+86400000*30).toISOString().slice(0,10);
  await customerPage.locator('[name="featuredUntil"]').fill(expiry);
  await customerPage.locator('[name="isVerified"]').check();
  await customerPage.locator('.admin-controls button').click();
  await text(customerPage, '#admin-message', 'Usta hesabı güncellendi');
  await customerPage.locator('#admin-reviews button').click();
  await text(customerPage, '#admin-message', 'Yorum onayı güncellendi');
  const publicPage = await (await context(true)).newPage();
  await publicPage.goto(origin);
  await visible(publicPage, '.badge-featured');
  await text(publicPage, '.rating', '1 yorum');
  await publicPage.locator('.rating .text-button').click();
  await text(publicPage, '#reviews-list', 'Belirtilen saatte');
  await environment.withSecurityRulesDisabled(async context => {
    const data=(await getDoc(doc(context.firestore(),'users',proUid))).data();
    assert.equal(data.credits,7); assert.equal(data.whatsappClicks,1);
    assert.equal(data.isFeatured,true); assert.equal(data.isVerified,true);
    assert.equal(data.reviewCount,1); assert.equal(data.ratingAvg,5);
  });
  assert.deepEqual(errors, []);
  console.log('Uçtan uca: e-posta kaydı → 3 kredi → müşteri talebi → maskeli telefon → 1 krediyle açma → WhatsApp sayacı → admin kredi/VIP/onay → yorum moderasyonu geçti.');
} catch(error) {
  for (const [index, value] of contexts.entries()) for (const [pageIndex,page] of value.pages().entries()) {
    await page.screenshot({path:`test-results/failure-${index}-${pageIndex}.png`,fullPage:true}).catch(()=>{});
    console.error(`Sayfa ${index}/${pageIndex}:`, (await page.locator('body').innerText()).slice(-5000));
  }
  throw error;
} finally {
  await environment?.cleanup();
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
