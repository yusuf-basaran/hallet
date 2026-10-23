import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dictionary, SUPPORTED_LANGUAGES, CATEGORY_IDS } from '../js/i18n.js';
import { LANGUAGE_PATHS, LANGUAGE_LOCALES, SOCIAL_IMAGE, createStructuredData } from '../js/seo.js';

export function resolveOrigin(env) {
  const value = env.SITE_ORIGIN || env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  if (!value) throw new Error('Yayın adresi bulunamadı. SITE_ORIGIN veya Vercel yayın değişkenlerini tanımlayın.');
  const url = new URL(value.includes('://') ? value : `https://${value}`);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Yayın adresi yalnızca protokol ve alan adı içermeli.');
  }
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Yayın adresi HTTPS kullanmalı.');
  }
  return url.origin;
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const translation = (language, key) => {
  const value = key.split('.').reduce((entry, part) => entry?.[part], dictionary[language]);
  if (typeof value !== 'string') throw new Error(`Çeviri bulunamadı: ${language}/${key}`);
  return value.replace(/\{year\}/g, String(new Date().getFullYear()));
};

export function renderTranslations(html, language) {
  html = html.replace(/<html\b[^>]*>/, `<html lang="${language}" dir="ltr">`);
  html = html.replace(/<([a-z][\w-]*)\b([^>]*\sdata-i18n="([^"]+)"[^>]*)>[\s\S]*?<\/\1>/gi,
    (_, tag, attributes, key) => `<${tag}${attributes}>${escapeHtml(translation(language, key))}</${tag}>`);
  html = html.replace(/<[a-z][^>]*>/gi, tag => {
    for (const [source, target] of [['placeholder', 'placeholder'], ['title', 'title'], ['aria-label', 'aria-label'], ['content', 'content']]) {
      const match = tag.match(new RegExp(`\\sdata-i18n-${source}="([^"]+)"`));
      if (!match) continue;
      const attribute = `${target}="${escapeHtml(translation(language, match[1]))}"`;
      const existing = new RegExp(`(?<![\\w-])${target}="[^"]*"`);
      tag = existing.test(tag) ? tag.replace(existing, attribute) : tag.replace(/>$/, ` ${attribute}>`);
    }
    return tag;
  });
  return html.replace(/(<a\b[^>]*data-language="([^"]+)"[^>]*?)aria-pressed="(?:true|false)"/g,
    (_, prefix, code) => `${prefix}aria-pressed="${code === language}"`);
}

function seoHead(origin, language, preview) {
  const data = dictionary[language];
  const url = `${origin}${LANGUAGE_PATHS[language]}`;
  const meta = (attribute, name, content) => `  <meta ${attribute}="${name}" content="${escapeHtml(content)}">`;
  const alternates = [...SUPPORTED_LANGUAGES, 'x-default'].map(code =>
    `  <link rel="alternate" hreflang="${code}" href="${origin}${LANGUAGE_PATHS[code] || '/'}">`);
  return [
    '  <meta name="hallet-page" content="home">',
    meta('name', 'robots', preview ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
    '  <meta name="author" content="HALLET">',
    `  <link rel="canonical" href="${escapeHtml(url)}">`, ...alternates,
    meta('property', 'og:type', 'website'), meta('property', 'og:site_name', 'HALLET'),
    meta('property', 'og:title', data.brand.title), meta('property', 'og:description', data.brand.description),
    meta('property', 'og:url', url), meta('property', 'og:locale', LANGUAGE_LOCALES[language]),
    ...SUPPORTED_LANGUAGES.filter(code => code !== language).map(code => meta('property', 'og:locale:alternate', LANGUAGE_LOCALES[code])),
    meta('property', 'og:image', `${origin}${SOCIAL_IMAGE}`), meta('property', 'og:image:secure_url', `${origin}${SOCIAL_IMAGE}`),
    meta('property', 'og:image:type', 'image/png'), meta('property', 'og:image:width', '1200'), meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', 'HALLET — KKTC Hizmet ve Usta Pazaryeri'),
    meta('name', 'twitter:card', 'summary_large_image'), meta('name', 'twitter:title', data.brand.title),
    meta('name', 'twitter:description', data.brand.description), meta('name', 'twitter:image', `${origin}${SOCIAL_IMAGE}`),
    meta('name', 'twitter:image:alt', 'HALLET — KKTC Hizmet ve Usta Pazaryeri'),
    `  <script type="application/ld+json" id="hallet-schema">${JSON.stringify(createStructuredData(origin, language, data)).replace(/</g, '\\u003c')}</script>`
  ].join('\n');
}

export async function buildSite({ root = process.cwd(), env = process.env, output = 'dist' } = {}) {
  const origin = resolveOrigin(env);
  const directory = resolve(root, output);
  if (directory !== join(resolve(root), 'dist')) throw new Error('Derleme çıktısı dist klasörü olmalı.');
  const preview = env.VERCEL_ENV === 'preview';
  const source = await readFile(join(root, 'index.html'), 'utf8');
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  for (const path of ['js', 'css', 'assets', 'favicon.svg', 'site.webmanifest', '404.html']) {
    await cp(join(root, path), join(directory, path), { recursive: true });
  }
  const dashboard = await readFile(join(root, 'dashboard.html'), 'utf8');
  await writeFile(join(directory, 'dashboard.html'), renderTranslations(dashboard, 'tr'));
  for (const language of SUPPORTED_LANGUAGES) {
    let html = renderTranslations(source, language).replace('  <meta name="hallet-page" content="home">', seoHead(origin, language, preview));
    const path = LANGUAGE_PATHS[language];
    html = html.replace(/href="\/#/g, `href="${path}#`);
    const services = CATEGORY_IDS.map(category => `<a class="service-chip" href="${path}?category=${category}#ustalar">${escapeHtml(dictionary[language].categories[category])}</a>`).join('');
    html = html.replace(/(<div\b[^>]*id="service-shortcuts"[^>]*>)[\s\S]*?<\/div>/, `$1${services}</div>`);
    await writeFile(join(directory, language === 'tr' ? 'index.html' : `${language}.html`), html);
  }
  const alternateLinks = [...SUPPORTED_LANGUAGES, 'x-default'].map(code =>
    `    <xhtml:link rel="alternate" hreflang="${code}" href="${escapeHtml(origin)}${LANGUAGE_PATHS[code] || '/'}"/>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${SUPPORTED_LANGUAGES.map(code => `  <url>\n    <loc>${escapeHtml(origin)}${LANGUAGE_PATHS[code]}</loc>\n${alternateLinks}\n  </url>`).join('\n')}\n</urlset>\n`;
  await writeFile(join(directory, 'sitemap.xml'), sitemap);
  await writeFile(join(directory, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  console.log(`HALLET: ${origin} için üç dilde yayın dosyaları hazır.`);
  return { origin, directory };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await buildSite();
}
