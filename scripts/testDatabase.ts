import { PrismaClient } from '@prisma/client';

type TestDatabaseEnvironment = {
  TEST_DATABASE_URL?: string;
  DATABASE_URL?: string;
  WEBMCP_TEST_DATABASE?: string;
  WEBMCP_ALLOW_SHARED_DATABASE?: string;
};

export function getVerifiedTestDatabaseUrl(environment: TestDatabaseEnvironment = process.env as unknown as TestDatabaseEnvironment): string {
  if (environment.WEBMCP_TEST_DATABASE !== 'true') {
    throw new Error('Set WEBMCP_TEST_DATABASE=true to acknowledge that the test database may be reset.');
  }
  const url = environment.TEST_DATABASE_URL || environment.DATABASE_URL;
  if (!url) throw new Error('Set TEST_DATABASE_URL or DATABASE_URL before running WebMCP integration tests.');
  const usesSharedDatabase = url === environment.DATABASE_URL;
  if (usesSharedDatabase && environment.WEBMCP_ALLOW_SHARED_DATABASE !== 'true') {
    throw new Error('This test URL is the application DATABASE_URL. Set WEBMCP_ALLOW_SHARED_DATABASE=true to explicitly permit reset/seed tests against it.');
  }
  return url;
}

export function createTestPrisma(environment: TestDatabaseEnvironment = process.env as unknown as TestDatabaseEnvironment): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: getVerifiedTestDatabaseUrl(environment) } } });
}
