const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = [
  { name: 'API', directory: 'backend', args: ['run', 'dev'] },
  { name: 'Web', directory: 'frontend', args: ['run', 'dev', '--', '--hostname', '127.0.0.1'] },
];

services.forEach(({ name, directory }) => {
  const cwd = path.join(__dirname, '..', directory);
  if (fs.existsSync(path.join(cwd, 'node_modules'))) return;

  console.log(`[${name}] Installing dependencies (first run only)...`);
  const result = spawnSync(npmCommand, ['install'], {
    cwd,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`[${name}] npm install failed. Fix the error above and re-run npm run dev.`);
    process.exit(result.status || 1);
  }
});

const children = services.map(({ name, directory, args }) => {
  const child = spawn(npmCommand, args, {
    cwd: path.join(__dirname, '..', directory),
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
  child.on('error', (error) => console.error(`[${name}] could not start: ${error.message}`));
  return child;
});

let stopping = false;
function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => {
    if (!child.pid) return;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  });
  process.exit(exitCode);
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
children.forEach((child) => child.on('exit', (code) => {
  if (!stopping && code !== 0) {
    console.error('A service stopped unexpectedly. Shutting down the remaining service.');
    stopAll(code || 1);
  }
}));

console.log('PRC Rental is starting...');
console.log('Open http://127.0.0.1:3000/login');
