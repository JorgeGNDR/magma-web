import { readdir, lstat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
// Changes to public assets require an explicit review of what becomes downloadable.
const allowed = new Set([
  'magma-logo.glb', 'studio_mesh.glb', 'audio/justanillusion.mp3',
  'draco/draco_decoder.js', 'draco/draco_decoder.wasm', 'draco/draco_wasm_wrapper.js',
]);
async function check(directory) {
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`Public symlink is not permitted: ${relative(root, path)}`);
    if (stat.isDirectory()) await check(path);
    else if (!allowed.has(relative(root, path).replaceAll('\\', '/'))) {
      throw new Error(`Unreviewed public asset: ${relative(root, path)}. Keep internal files outside public/.`);
    }
  }
}
await check(root);
console.log('Public assets match the reviewed allowlist.');
