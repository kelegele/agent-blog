// @ts-check
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { join, relative } from 'node:path';

const distDir = new URL('../dist/', import.meta.url);
const requiredPatterns = [
  /<title>[^<]+<\/title>/,
  /<meta name="description" content="[^"]+"/,
  /<link rel="canonical" href="https:\/\/www\.kelegele\.com[^"]*"/,
  /<meta property="og:title" content="[^"]+"/,
  /<meta property="og:description" content="[^"]+"/,
  /<meta name="twitter:card" content="summary_large_image"/,
  /<script type="application\/ld\+json">/,
];

const failures = [];

for await (const file of glob('**/*.html', { cwd: distDir })) {
  const fullPath = join(distDir.pathname, file);
  const html = await readFile(fullPath, 'utf8');
  const missing = requiredPatterns.filter((pattern) => !pattern.test(html));

  if (missing.length > 0) {
    failures.push(`${relative(distDir.pathname, fullPath)} is missing ${missing.length} SEO tag(s)`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('SEO tags present in built HTML.');
