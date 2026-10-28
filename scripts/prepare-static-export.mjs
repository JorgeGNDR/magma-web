import { access, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Hosts may run source scripts through symlinks in a separate build directory.
// Next writes out/ in the build working directory, not beside the source script.
const output = resolve('out');
// Keep hosting configuration outside public/ and package only this reviewed file.
for (const file of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) {
  await access(resolve(output, file));
}
await copyFile(
  new URL('../deployment/apache.htaccess', import.meta.url),
  resolve(output, '.htaccess'),
);
console.log('Static site ready in out/ (including Apache hosting rules).');
