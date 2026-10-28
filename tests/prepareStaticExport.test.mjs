import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('packages the export from a build directory separate from the source', async () => {
  const build = await mkdtemp(join(tmpdir(), 'magma-export-'));
  try {
    const output = join(build, 'out');
    await mkdir(output);
    for (const name of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) {
      await writeFile(join(output, name), 'exported');
    }
    execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/prepare-static-export.mjs', import.meta.url))], { cwd: build });
    assert.equal(
      await readFile(join(output, '.htaccess'), 'utf8'),
      await readFile(new URL('../deployment/apache.htaccess', import.meta.url), 'utf8'),
    );
  } finally {
    await rm(build, { recursive: true, force: true });
  }
});
