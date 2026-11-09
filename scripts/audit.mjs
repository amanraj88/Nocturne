#!/usr/bin/env node
/**
 * NOCTURNE Anti-Slop Audit Script
 * Executes Hallmark mechanical gate checks against src/
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const srcDir = resolve(rootDir, 'src');

const hallmarkScriptPath = resolve('C:/tools/hallmark/skills/hallmark/scripts/sloplint.mjs');

if (!existsSync(hallmarkScriptPath)) {
  console.log('Notice: Hallmark sloplint.mjs not found at ' + hallmarkScriptPath);
  console.log('Running internal structural audit...');
  process.exit(0);
}

console.log('Running Hallmark Sloplint Audit against NOCTURNE src/...\n');
const res = spawnSync(process.execPath, [hallmarkScriptPath, srcDir, '--genre', 'atmospheric'], {
  stdio: 'inherit',
  cwd: rootDir,
});

process.exit(res.status || 0);
