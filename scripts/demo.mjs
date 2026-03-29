import { run } from './common-local.mjs';
import { nodeCommand, repoDir } from './common-local.mjs';

async function main() {
  const node = nodeCommand();

  console.log('Preparing demo environment...');
  await run(node, ['scripts/install-local.mjs'], repoDir, {
    env: { APP_MODE: 'demo' },
  });

  console.log('Starting demo stack...');
  await run(node, ['scripts/dev-local.mjs'], repoDir, {
    env: { APP_MODE: 'demo' },
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
