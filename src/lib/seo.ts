/**
 * SEO Utility for dynamic Metadata and Schema.org structured data injection
 */

export function updateMetaTag(name: string, value: string, isProperty = false) {
  const attribute = isProperty ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

export function updateCanonicalLink(url: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export function injectStructuredData(id: string, data: object) {
  let script = document.getElementById(id);
  if (script) {
    script.textContent = JSON.stringify(data);
  } else {
    script = document.createElement('script');
    script.id = id;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
}

export function clearStructuredData(id: string) {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  schema?: object;
}

export function applySEO({
  title,
  description,
  keywords,
  image,
  url,
  schema
}: SEOConfig) {
  if (typeof window === 'undefined') return;

  // Update document title
  document.title = title;

  // Basic meta tags
  updateMetaTag('description', description);
  if (keywords) {
    updateMetaTag('keywords', keywords);
  } else {
    updateMetaTag('keywords', 'AsooYeshua, Tersoo Terence Aker, Grace, Gospel of Jesus Christ, salvation, faith, Christian ebooks, Bible study PWA, Christian ministry');
  }

  // Open Graph
  const currentUrl = url || window.location.href;
  const origin = window.location.origin || 'https://asooyeshua.com';
  const defaultImage = `${origin}/src/assets/images/asooyeshua_ministry_1_1784026970487.jpg`;
  const imageUrl = image && image.startsWith('/') ? `${origin}${image}` : (image || defaultImage);

  updateMetaTag('og:title', title, true);
  updateMetaTag('og:description', description, true);
  updateMetaTag('og:url', currentUrl, true);
  updateMetaTag('og:image', imageUrl, true);
  updateMetaTag('og:type', 'website', true);

  // Twitter
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', title);
  updateMetaTag('twitter:description', description);
  updateMetaTag('twitter:image', imageUrl);

  // Canonical url
  updateCanonicalLink(currentUrl);

  // Schema Markup
  if (schema) {
    injectStructuredData('seo-schema', schema);
  } else {
    clearStructuredData('seo-schema');
  }
}
