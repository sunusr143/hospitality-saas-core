import {
  backendDir,
  npmCommand,
  start,
  uiDir,
  waitForHttp,
} from './common-local.mjs';

const npm = npmCommand();
const children = [
  start(npm, ['run', 'start:dev'], backendDir),
  start(npm, ['run', 'dev', '--', '--host', '0.0.0.0'], uiDir),
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

waitForHttp('http://localhost:3000/health/live')
  .then(() => {
    const appMode = process.env.APP_MODE ?? 'demo';
    console.log('');
    console.log(`${appMode === 'demo' ? 'Demo' : 'Application'} backend is live: http://localhost:3000`);
    console.log(`${appMode === 'demo' ? 'Demo' : 'Application'} UI is expected at: http://localhost:5173`);
    if (appMode === 'demo') {
      console.log('Login: admin@sunu.com / admin123');
    }
    console.log('');
  })
  .catch((error) => {
    console.error(error.message);
    shutdown('SIGTERM');
    process.exit(1);
  });
