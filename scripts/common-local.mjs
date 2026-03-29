import { spawn } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoDir = path.resolve(scriptDir, '..');
export const backendDir = path.join(repoDir, 'backend');
export const uiDir = path.join(repoDir, 'ui');

export function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function nodeCommand() {
  return process.platform === 'win32' ? 'node.exe' : 'node';
}

export function run(command, args, cwd, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: options.stdio ?? 'inherit',
      shell: false,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`,
        ),
      );
    });

    child.on('error', reject);
  });
}

export function start(command, args, cwd, options = {}) {
  return spawn(command, args, {
    cwd,
    stdio: options.stdio ?? 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  });
}

export function ensureFile(targetPath, sourcePath) {
  if (!existsSync(targetPath) && existsSync(sourcePath)) {
    copyFileSync(sourcePath, targetPath);
    console.log(`Created ${path.relative(repoDir, targetPath)}`);
  }
}

export function ensureUiEnv() {
  const uiEnvPath = path.join(uiDir, '.env.local');
  if (!existsSync(uiEnvPath)) {
    writeFileSync(uiEnvPath, 'VITE_API_BASE=http://localhost:3000\nVITE_APP_MODE=demo\n', 'utf8');
    console.log('Created ui/.env.local');
  }
}

export async function ensureDependencies() {
  const npm = npmCommand();

  if (!existsSync(path.join(repoDir, 'node_modules'))) {
    console.log('Installing root dependencies...');
    await run(npm, ['install'], repoDir);
  }

  if (!existsSync(path.join(backendDir, 'node_modules'))) {
    console.log('Installing backend dependencies...');
    await run(npm, ['install'], backendDir);
  }

  if (!existsSync(path.join(uiDir, 'node_modules'))) {
    console.log('Installing UI dependencies...');
    await run(npm, ['install'], uiDir);
  }
}

export function parseEnvFile(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

export async function waitForTcpPort({ host, port, timeoutMs = 10000 }) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const connected = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port });

      socket.once('connect', () => {
        socket.end();
        resolve(true);
      });

      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (connected) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for TCP ${host}:${port}`);
}

export async function waitForHttp(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Timed out waiting for ${url}`);
}
