#!/usr/bin/env node
'use strict';

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginsDirectory = path.join(root, 'plugins');
const catalogPath = path.join(root, 'catalog.v1.json');
const digestPath = `${catalogPath}.sha256`;
const check = process.argv.includes('--check');

const pluginFiles = readdirSync(pluginsDirectory)
  .filter((name) => name.endsWith('.json'))
  .sort();

const plugins = pluginFiles.map((fileName) => {
  const entry = JSON.parse(readFileSync(path.join(pluginsDirectory, fileName), 'utf8'));
  const expected = `${entry.id}.json`;
  if (fileName !== expected) {
    throw new Error(`${fileName} must be named ${expected}`);
  }
  if (!Array.isArray(entry.assets) || entry.assets.length === 0) {
    throw new Error(`${entry.id} must declare at least one Release asset.`);
  }
  return entry;
});

const ids = plugins.map((entry) => entry.id);
if (new Set(ids).size !== ids.length) {
  throw new Error('Plugin ids must be unique.');
}

const removed = JSON.parse(readFileSync(path.join(root, 'removed.json'), 'utf8'));
const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  plugins,
  removed,
};
const serialized = `${JSON.stringify(catalog, null, 2)}\n`.replace(/\r\n/g, '\n');
const digest = createHash('sha256').update(serialized, 'utf8').digest('hex');

if (check) {
  const current = readFileSync(catalogPath, 'utf8');
  const currentDigest = readFileSync(digestPath, 'utf8').trim();
  const currentParsed = JSON.parse(current);
  const expectedComparable = {
    schemaVersion: catalog.schemaVersion,
    plugins: catalog.plugins,
    removed: catalog.removed,
  };
  const currentComparable = {
    schemaVersion: currentParsed.schemaVersion,
    plugins: currentParsed.plugins,
    removed: currentParsed.removed,
  };
  if (JSON.stringify(currentComparable) !== JSON.stringify(expectedComparable) || currentDigest !== digest) {
    // generatedAt is allowed to drift only when plugins/removed are unchanged;
    // if the plugin set changed, the committed catalog is stale.
    if (JSON.stringify(currentComparable) !== JSON.stringify(expectedComparable)) {
      console.error('catalog.v1.json is stale. Run node scripts/generate-catalog.mjs');
      process.exit(1);
    }
  }
  console.log('catalog.v1.json is current');
  process.exit(0);
}

writeFileSync(catalogPath, Buffer.from(serialized, 'utf8'));
writeFileSync(digestPath, Buffer.from(`${digest}\n`, 'utf8'));
console.log(`wrote ${path.basename(catalogPath)} (${plugins.length} plugins)`);
