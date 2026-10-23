export const LANGUAGE_PATHS = Object.freeze({ tr: "/", en: "/en", ru: "/ru" });
export const LANGUAGE_LOCALES = Object.freeze({ tr: "tr_TR", en: "en_GB", ru: "ru_RU" });
export const SOCIAL_IMAGE = "/assets/brand/hallet-share.png";

export function createStructuredData(origin, language, translations) {
  const pageUrl = new URL(LANGUAGE_PATHS[language], origin).href;
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": organizationId, name: "HALLET", url: `${origin}/`,
        logo: { "@type": "ImageObject", url: `${origin}/assets/brand/hallet-icon-512.png`, width: 512, height: 512 },
        areaServed: ["Lefkoşa", "Gazimağusa", "Girne", "İskele", "Güzelyurt", "Lefke"].map(name => ({ "@type": "AdministrativeArea", name }))
      },
      {
        "@type": "WebSite", "@id": websiteId, name: "HALLET", url: `${origin}/`,
        publisher: { "@id": organizationId }, inLanguage: ["tr", "en", "ru"]
      },
      {
        "@type": "WebPage", "@id": `${pageUrl}#webpage`, url: pageUrl,
        name: translations.brand.title, description: translations.brand.description,
        inLanguage: language, isPartOf: { "@id": websiteId },
        about: Object.values(translations.categories).map(name => ({ "@type": "Thing", name })),
        primaryImageOfPage: { "@type": "ImageObject", url: `${origin}${SOCIAL_IMAGE}`, width: 1200, height: 630 }
      }
    ]
  };
}

export function syncSeo(language, translations) {
  if (!document.head) return;
  const publicPage = document.querySelector('meta[name="hallet-page"][content="home"]');
  const path = LANGUAGE_PATHS[language];
  for (const link of document.querySelectorAll('a[data-language]')) {
    link.href = LANGUAGE_PATHS[link.dataset.language];
    if (link.dataset.language === language) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  if (!publicPage) return;
  const current = new URL(window.location.href);
  if (Object.values(LANGUAGE_PATHS).includes(current.pathname) && current.pathname !== path) {
    current.pathname = path;
    window.history.replaceState(null, "", `${current.pathname}${current.search}${current.hash}`);
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  const origin = canonical ? new URL(canonical.href).origin : window.location.origin;
  const url = new URL(path, origin).href;
  const values = {
    'meta[property="og:title"]': translations.brand.title,
    'meta[property="og:description"]': translations.brand.description,
    'meta[property="og:url"]': url,
    'meta[property="og:locale"]': LANGUAGE_LOCALES[language],
    'meta[name="twitter:title"]': translations.brand.title,
    'meta[name="twitter:description"]': translations.brand.description,
    'meta[property="og:image:alt"]': "HALLET — KKTC Hizmet ve Usta Pazaryeri",
    'meta[name="twitter:image:alt"]': "HALLET — KKTC Hizmet ve Usta Pazaryeri"
  };
  if (canonical) canonical.href = url;
  for (const [selector, content] of Object.entries(values)) {
    document.querySelector(selector)?.setAttribute("content", content);
  }
  for (const element of document.querySelectorAll('meta[property="og:locale:alternate"]')) element.remove();
  for (const [code, locale] of Object.entries(LANGUAGE_LOCALES)) {
    if (code === language) continue;
    const element = document.createElement("meta");
    element.setAttribute("property", "og:locale:alternate");
    element.setAttribute("content", locale);
    document.head.append(element);
  }
  const schema = document.querySelector('#hallet-schema');
  if (schema) schema.textContent = JSON.stringify(createStructuredData(origin, language, translations));
  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute("href");
    if (/^\/(?:en|ru)?#/.test(href)) link.setAttribute("href", `${path}${href.slice(href.indexOf("#"))}`);
  }
}
