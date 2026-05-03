import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const commands = [
  { name: 'server', cwd: path.join(root, 'server'), args: ['run', 'dev'] },
  { name: 'client', cwd: path.join(root, 'client'), args: ['run', 'dev'] }
];
const children = [];

for (const command of commands) {
  const child = spawn('npm', command.args, {
    cwd: command.cwd,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${command.name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${command.name}] ${data}`);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${command.name}] exited with code ${code}`);
      shutdown();
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(1);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
