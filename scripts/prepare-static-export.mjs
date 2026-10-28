import { access, copyFile } from 'node:fs/promises';

// Keep hosting configuration outside public/ and package only this reviewed file.
for (const file of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) {
  await access(new URL(`../out/${file}`, import.meta.url));
}
await copyFile(
  new URL('../deployment/apache.htaccess', import.meta.url),
  new URL('../out/.htaccess', import.meta.url),
);
console.log('Static site ready in out/ (including Apache hosting rules).');
