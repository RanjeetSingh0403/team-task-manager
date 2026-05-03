import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './run.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

run('npm', ['install'], path.join(root, 'server'));
run('npm', ['install'], path.join(root, 'client'));
run('npm', ['run', 'build'], path.join(root, 'client'));
