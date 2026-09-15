import { execFileSync } from 'node:child_process';
import { getVerifiedTestDatabaseUrl } from './testDatabase';

const databaseUrl = getVerifiedTestDatabaseUrl();
const environment = { ...process.env, DATABASE_URL: databaseUrl, WEBMCP_TEST_DATABASE: 'true', WEBMCP_RUN_INTEGRATION: 'true' };

execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { stdio: 'inherit', env: environment });
// The seed clears data by design; this runner reaches it only after the URL
// safety gate has verified the dedicated disposable database.
execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], { stdio: 'inherit', env: environment });
execFileSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/webmcp.test.ts', '--pool=forks', '--reporter=verbose'], { stdio: 'inherit', env: environment });
