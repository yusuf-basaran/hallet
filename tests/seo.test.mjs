import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, resolveOrigin } from '../scripts/build.mjs';
import { dictionary } from '../js/i18n.js';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'hallet-seo-'));
  try {
    for (const file of ['index.html', 'dashboard.html', '404.html', 'js', 'css', 'assets', 'favicon.svg', 'site.webmanifest', 'google674aad00b94cd44d.html']) {
      await cp(file, join(root, file), { recursive: true });
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const meta = (html, key) => html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1];
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');

test('Yayın adresi Vercel’den alınır, özel domain önceliklidir ve geçersiz adres reddedilir', () => {
  assert.equal(resolveOrigin({ VERCEL_PROJECT_PRODUCTION_URL: 'production.example', VERCEL_URL: 'preview.example' }), 'https://production.example');
  assert.equal(resolveOrigin({ VERCEL_URL: 'preview.example' }), 'https://preview.example');
  assert.equal(resolveOrigin({ SITE_ORIGIN: 'https://custom.example/', VERCEL_PROJECT_PRODUCTION_URL: 'production.example' }), 'https://custom.example');
  for (const SITE_ORIGIN of ['https://user:pass@example.com', 'https://example.com/path', 'https://example.com?a=1', 'http://example.com', 'javascript:alert(1)']) {
    assert.throws(() => resolveOrigin({ SITE_ORIGIN }));
  }
  assert.throws(() => resolveOrigin({}));
});

test('Üç dil JavaScript gerektirmeden tutarlı başlık, içerik, canonical, sosyal kart ve şema sunar', async () => {
  await fixture(async root => {
    await buildSite({ root, env: { SITE_ORIGIN: 'https://market.example' } });
    for (const [code, file, path] of [['tr', 'index.html', '/'], ['en', 'en.html', '/en'], ['ru', 'ru.html', '/ru']]) {
      const html = await readFile(join(root, 'dist', file), 'utf8');
      assert.ok(html.includes(`<html lang="${code}"`));
      assert.equal(decode(html.match(/<title[^>]*>([^<]*)<\/title>/)[1]), dictionary[code].brand.title);
      assert.equal(decode(meta(html, 'description')), dictionary[code].brand.description);
      assert.equal(decode(html.match(/<h1[^>]*>([^<]*)<\/h1>/)[1]), dictionary[code].home.title);
      assert.equal((html.match(/<h1\b/g) || []).length, 1);
      assert.ok(html.includes(`rel="canonical" href="https://market.example${path}"`));
      assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
      assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, 4);
      assert.equal(meta(html, 'og:url'), `https://market.example${path}`);
      assert.equal(decode(meta(html, 'og:title')), dictionary[code].brand.title);
      assert.equal(decode(meta(html, 'twitter:description')), dictionary[code].brand.description);
      assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
      assert.equal(meta(html, 'og:image'), 'https://market.example/assets/brand/hallet-share.png');
      assert.equal(meta(html, 'og:image:width'), '1200');
      assert.equal(meta(html, 'og:image:height'), '630');
      assert.ok(meta(html, 'robots').startsWith('index, follow'));
      const schema = JSON.parse(html.match(/id="hallet-schema">([^<]*)<\/script>/)[1]);
      assert.deepEqual(schema['@graph'].map(item => item['@type']), ['Organization', 'WebSite', 'WebPage']);
      assert.equal(schema['@graph'][2].inLanguage, code);
      assert.equal(schema['@graph'][2].url, `https://market.example${path}`);
      assert.equal(schema['@graph'][0].areaServed.length, 6);
      assert.ok(!JSON.stringify(schema).includes('aggregateRating'));
      assert.ok(html.includes(`${path}?category=ac-repair#ustalar`));
      assert.ok(html.includes(`href="${path}#ustalar"`));
      assert.ok(!html.includes('data-i18n-placeholder="wizard.detailPlaceholder"></textarea>'));
    }
    const image = await readFile(join(root, 'dist/assets/brand/hallet-share.png'));
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
  });
});

test('Sitemap yalnızca herkese açık sayfaları içerir; panelin noindex talimatı taranabilir', async () => {
  await fixture(async root => {
    await buildSite({ root, env: { SITE_ORIGIN: 'https://market.example' } });
    const sitemap = await readFile(join(root, 'dist/sitemap.xml'), 'utf8');
    assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), ['https://market.example/', 'https://market.example/en', 'https://market.example/ru']);
    assert.equal((sitemap.match(/<xhtml:link /g) || []).length, 12);
    assert.ok(!/dashboard|category=|lastmod/.test(sitemap));
    const robots = await readFile(join(root, 'dist/robots.txt'), 'utf8');
    assert.ok(robots.includes('Sitemap: https://market.example/sitemap.xml'));
    assert.ok(!robots.includes('Disallow: /dashboard'));
    assert.equal(meta(await readFile(join(root, 'dist/dashboard.html'), 'utf8'), 'robots'), 'noindex, nofollow, noarchive');
    assert.equal(meta(await readFile(join(root, 'dist/404.html'), 'utf8'), 'robots'), 'noindex, follow');
    const config = JSON.parse(await readFile('vercel.json', 'utf8'));
    assert.ok(config.headers.some(rule => rule.source === '/dashboard(.*)' && rule.headers.some(header => header.key === 'X-Robots-Tag' && header.value.includes('noindex'))));
    assert.equal(config.outputDirectory, 'dist');
  });
});

test('Domain değişiminde eski adres bırakılmaz, yayın klasöründe özel dosyalar bulunmaz', async () => {
  await fixture(async root => {
    await buildSite({ root, env: { SITE_ORIGIN: 'https://old.example' } });
    await buildSite({ root, env: { SITE_ORIGIN: 'https://new.example' } });
    for (const file of ['index.html', 'en.html', 'ru.html', 'sitemap.xml', 'robots.txt']) {
      const content = await readFile(join(root, 'dist', file), 'utf8');
      assert.ok(!content.includes('https://old.example'));
      assert.ok(content.includes('https://new.example'));
    }
    for (const file of ['firestore.rules', 'package-lock.json', '.firebaserc', 'README.md', 'scripts/firebase.mjs']) {
      await assert.rejects(readFile(join(root, 'dist', file)));
    }
  });
});

test('Preview sayfaları dizine kapalıdır ve canonical yayın adresini kullanır', async () => {
  await fixture(async root => {
    await buildSite({ root, env: { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'production.example', VERCEL_URL: 'preview.example' } });
    const html = await readFile(join(root, 'dist/en.html'), 'utf8');
    assert.equal(meta(html, 'robots'), 'noindex, nofollow');
    assert.ok(html.includes('rel="canonical" href="https://production.example/en"'));
    assert.equal(await readFile(join(root, 'dist/robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n');
  });
});
