import sitemap from '../src/app/sitemap';

const urls = sitemap();
const seen = new Set<string>();
const duplicateUrls: string[] = [];

for (const entry of urls) {
  if (!entry.url.startsWith('https://news-pulse.org')) {
    throw new Error(`Unexpected sitemap host: ${entry.url}`);
  }

  if (seen.has(entry.url)) {
    duplicateUrls.push(entry.url);
  }

  seen.add(entry.url);
}

if (duplicateUrls.length > 0) {
  throw new Error(`Duplicate sitemap URLs: ${duplicateUrls.join(', ')}`);
}

if (!seen.has('https://news-pulse.org/about')) {
  throw new Error('Sitemap is missing /about');
}

if (!seen.has('https://news-pulse.org/sources')) {
  throw new Error('Sitemap is missing /sources');
}

if (!Array.from(seen).some((url) => url.startsWith('https://news-pulse.org/source/'))) {
  throw new Error('Sitemap is missing source profile pages');
}

console.log(`Sitemap check passed: ${urls.length} URLs`);
