import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const skipped = new Set(['data', 'scripts', '.git', 'node_modules']);
const assets = '<link rel="stylesheet" href="/Other/theme.css?v=17"><script src="/Other/api.js?v=17"></script><script src="/Other/language.js?v=17" defer></script><script src="/Other/global-ui.js?v=17" defer></script>';

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (extname(path).toLowerCase() === '.html') {
      let html = await readFile(path, 'utf8');
      html = html.replace(/<link rel="stylesheet" href="\/Other\/theme\.css[^>]*><script src="\/Other\/api\.js[^>]*><\/script><script src="\/Other\/language\.js[^>]*><\/script><script src="\/Other\/global-ui\.js[^>]*><\/script>/g, '');
      html = html.replace(/<\/head>/i, assets + '</head>');
      await writeFile(path, html, 'utf8');
    }
  }
}

await visit(root);
console.log('Shared assets injected into every HTML page.');
