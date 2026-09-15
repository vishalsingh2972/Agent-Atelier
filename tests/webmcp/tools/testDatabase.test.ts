import { describe, expect, it } from 'vitest';
import { getVerifiedTestDatabaseUrl } from '../../../scripts/testDatabase';

describe('dedicated WebMCP test database safety gate', () => {
  const testUrl = 'postgresql://test-user:test-password@localhost/agentbridge_webmcp_test';

  it('accepts an explicitly acknowledged, separate test URL', () => {
    expect(getVerifiedTestDatabaseUrl({ TEST_DATABASE_URL: testUrl, DATABASE_URL: 'postgresql://app/app', WEBMCP_TEST_DATABASE: 'true' })).toBe(testUrl);
  });

  it('rejects a missing acknowledgement', () => {
    expect(() => getVerifiedTestDatabaseUrl({ TEST_DATABASE_URL: testUrl })).toThrow('WEBMCP_TEST_DATABASE=true');
  });

  it('rejects the application database until shared reset is explicitly acknowledged', () => {
    expect(() => getVerifiedTestDatabaseUrl({ DATABASE_URL: testUrl, WEBMCP_TEST_DATABASE: 'true' })).toThrow('WEBMCP_ALLOW_SHARED_DATABASE=true');
  });

  it('allows the application database only with an explicit shared-reset acknowledgement', () => {
    expect(getVerifiedTestDatabaseUrl({ DATABASE_URL: testUrl, WEBMCP_TEST_DATABASE: 'true', WEBMCP_ALLOW_SHARED_DATABASE: 'true' })).toBe(testUrl);
  });
});
