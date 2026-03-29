import path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  backendDir,
  ensureDependencies,
  ensureFile,
  ensureUiEnv,
  npmCommand,
  repoDir,
  run,
  parseEnvFile,
  waitForTcpPort,
} from './common-local.mjs';

async function main() {
  ensureFile(
    path.join(backendDir, '.env'),
    path.join(backendDir, '.env.example'),
  );
  ensureUiEnv();

  const npm = npmCommand();
  await ensureDependencies();

  const envPath = path.join(backendDir, '.env');
  const envValues = parseEnvFile(readFileSync(envPath, 'utf8'));
  const dbHost = envValues.DB_HOST || 'localhost';
  const dbPort = Number(envValues.DB_PORT || 5432);

  console.log(`Checking PostgreSQL on ${dbHost}:${dbPort}...`);
  await waitForTcpPort({
    host: dbHost,
    port: dbPort,
    timeoutMs: 10000,
  });

  console.log('Running backend migrations...');
  await run(npm, ['run', 'migration:run'], backendDir);

  if ((process.env.APP_MODE ?? 'demo') === 'demo') {
    console.log('Creating demo data...');
    await run(npm, ['run', 'setup:demo'], backendDir, {
      env: { APP_MODE: 'demo' },
    });
  } else {
    console.log('Creating production base data...');
    await run(npm, ['run', 'setup:production'], backendDir, {
      env: { ...process.env, APP_MODE: 'production' },
    });
  }

  console.log('Building backend for validation...');
  await run(npm, ['run', 'build'], backendDir);

  console.log('');
  console.log('Local install complete.');
  console.log('Start the app with:');
  console.log((process.env.APP_MODE ?? 'demo') === 'demo' ? '  npm run demo' : '  npm run dev');
  console.log('or double-click start.cmd on Windows.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
