#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.cwd(), 'dist');
const ignoredNames = new Set(['index.html', '+not-found.html', '_sitemap.html']);

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  if (!await pathExists(distDir)) {
    throw new Error(`Missing dist directory: ${distDir}`);
  }

  const htmlFiles = await walk(distDir);
  let generated = 0;

  for (const filePath of htmlFiles) {
    const relative = path.relative(distDir, filePath);
    const baseName = path.basename(relative);
    if (ignoredNames.has(baseName)) continue;
    if (relative.includes(`${path.sep}[`)) continue;

    const routeDir = path.join(distDir, relative.replace(/\.html$/, ''));
    const routeIndex = path.join(routeDir, 'index.html');
    await fs.mkdir(routeDir, { recursive: true });
    await fs.copyFile(filePath, routeIndex);
    generated += 1;
  }

  console.log(`Prepared ${generated} clean static route entr${generated === 1 ? 'y' : 'ies'}.`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
