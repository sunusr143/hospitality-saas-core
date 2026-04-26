import {
  backendDir,
  npmCommand,
  run,
  start,
  uiDir,
  waitForHttp,
} from './common-local.mjs';

const npm = npmCommand();

async function main() {
  console.log('Building backend and UI for production-style startup...');
  await run(npm, ['run', 'build'], backendDir);
  await run(npm, ['run', 'build'], uiDir);

  const children = [
    start(npm, ['run', 'start:prod'], backendDir),
    start(npm, ['run', 'preview', '--', '--host', '0.0.0.0'], uiDir),
  ];

  function shutdown(signal) {
    for (const child of children) {
      if (!child.killed) {
        child.kill(signal);
      }
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  for (const child of children) {
    child.on('exit', (code) => {
      if (code && code !== 0) {
        shutdown('SIGTERM');
        process.exit(code);
      }
    });
  }

  try {
    await waitForHttp('http://localhost:3000/health/live');
    console.log('');
    console.log('Production-style backend is live: http://localhost:3000');
    console.log('Production-style UI preview is expected at: http://localhost:4173');
    console.log('');
  } catch (error) {
    console.error(error.message);
    shutdown('SIGTERM');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
