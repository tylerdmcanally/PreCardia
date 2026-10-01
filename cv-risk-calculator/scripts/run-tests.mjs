import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const output = mkdtempSync(join(tmpdir(), 'precardia-tests-'));
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.test.json', '--outDir', output], { stdio: 'inherit' });
  writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
  const tests = readdirSync(join(output, 'tests')).filter(file => file.endsWith('.test.js')).map(file => join(output, 'tests', file));
  execFileSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
} catch (error) {
  process.exitCode = error.status || 1;
} finally {
  rmSync(output, { recursive: true, force: true });
}
