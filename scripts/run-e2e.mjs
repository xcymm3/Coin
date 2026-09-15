import { spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const nodePath = process.execPath;
const vitePath = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const playwrightPath = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));

function waitForServer(attempts = 50) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      const request = http.get('http://127.0.0.1:5173', response => {
        response.resume();
        if (response.statusCode === 200) resolve();
        else if (remaining > 0) setTimeout(() => check(remaining - 1), 100);
        else reject(new Error(`Vite returned HTTP ${response.statusCode}`));
      });
      request.on('error', error => remaining > 0 ? setTimeout(() => check(remaining - 1), 100) : reject(error));
      request.setTimeout(1_000, () => request.destroy());
    };
    check(attempts);
  });
}

function closeCode(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => resolve(code ?? 1));
  });
}

const server = spawn(nodePath, [vitePath, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
  cwd: root, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true,
});

let exitCode = 1;
try {
  await waitForServer();
  const runner = spawn(nodePath, [playwrightPath, 'test', ...process.argv.slice(2)], {
    cwd: root, stdio: 'inherit', windowsHide: true,
  });
  exitCode = await closeCode(runner);
} finally {
  server.kill();
  await Promise.race([closeCode(server), new Promise(resolve => setTimeout(resolve, 2_000))]);
}

process.exitCode = exitCode;
