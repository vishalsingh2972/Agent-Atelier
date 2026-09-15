import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginTool, registerTool, logoutTool, getAccountInfoTool } from '../../../src/webmcp/tools/authTools';
import { WebMCPRegistry } from '../../../src/webmcp/registry';

const successLogin = { success: true, user: { id: 'u1', email: 'demo@agentbridge.io', name: 'Demo User', role: 'CUSTOMER' }, message: 'Login successful' };
const failedLogin = { success: false, message: 'Invalid credentials' };
const successRegister = { success: true, user: { id: 'u2', email: 'new@test.com', name: 'New User', role: 'CUSTOMER' }, message: 'Account created' };
const successMe = { success: true, authenticated: true, user: { id: 'u1', email: 'demo@agentbridge.io', name: 'Demo User', role: 'CUSTOMER' } };
const guestMe = { success: true, authenticated: false };

function mockFetch(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue(payload) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function expectRequest(fetchMock: ReturnType<typeof mockFetch>, url: string, method = 'GET', body?: unknown) {
  expect(fetchMock).toHaveBeenCalledOnce();
  const [actualUrl, options] = fetchMock.mock.calls[0];
  expect(actualUrl).toBe(url);
  expect(options?.method || 'GET').toBe(method);
  if (body !== undefined) expect(JSON.parse(options.body)).toEqual(body);
}

afterEach(() => vi.unstubAllGlobals());

describe('WebMCP auth tool request contracts', () => {
  it('login calls /api/auth/login with POST and email/password body', async () => {
    const fetchMock = mockFetch(successLogin);
    await loginTool.execute({ email: 'demo@agentbridge.io', password: 'password123' });
    expectRequest(fetchMock, '/api/auth/login', 'POST', { email: 'demo@agentbridge.io', password: 'password123' });
  });

  it('register calls /api/auth/register with POST and name/email/password body', async () => {
    const fetchMock = mockFetch(successRegister);
    await registerTool.execute({ name: 'New User', email: 'new@test.com', password: 'pass123' });
    expectRequest(fetchMock, '/api/auth/register', 'POST', { name: 'New User', email: 'new@test.com', password: 'pass123' });
  });

  it('logout calls /api/auth/logout with POST', async () => {
    const fetchMock = mockFetch({ success: true });
    await logoutTool.execute({});
    expectRequest(fetchMock, '/api/auth/logout', 'POST');
  });

  it('get_account_info calls /api/auth/me with GET', async () => {
    const fetchMock = mockFetch(successMe);
    await getAccountInfoTool.execute({});
    expectRequest(fetchMock, '/api/auth/me');
  });
});

describe('WebMCP auth tool response contracts', () => {
  it('login returns user profile on success', async () => {
    mockFetch(successLogin);
    const result = await loginTool.execute({ email: 'demo@agentbridge.io', password: 'password123' });
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('demo@agentbridge.io');
  });

  it('login returns error on invalid credentials', async () => {
    mockFetch(failedLogin);
    const result = await loginTool.execute({ email: 'bad@test.com', password: 'wrong' });
    expect(result.success).toBe(false);
  });

  it('get_account_info returns authenticated profile for logged-in user', async () => {
    mockFetch(successMe);
    const result = await getAccountInfoTool.execute({});
    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(true);
    expect(result.user.id).toBe('u1');
  });

  it('get_account_info returns unauthenticated status for guest', async () => {
    mockFetch(guestMe);
    const result = await getAccountInfoTool.execute({});
    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(false);
  });
});

describe('WebMCP auth tool registry integration', () => {
  it('validates required email and password for login', async () => {
    const registry = new WebMCPRegistry();
    registry.registerTool(loginTool);
    expect((await registry.executeTool('login', {})).error).toBe('INVALID_INPUT');
    expect((await registry.executeTool('login', { email: 'test@test.com' })).error).toBe('INVALID_INPUT');
  });

  it('validates required name, email, and password for register', async () => {
    const registry = new WebMCPRegistry();
    registry.registerTool(registerTool);
    expect((await registry.executeTool('register', {})).error).toBe('INVALID_INPUT');
    expect((await registry.executeTool('register', { name: 'test', email: 'test@test.com' })).error).toBe('INVALID_INPUT');
  });

  it('logout requires authentication', async () => {
    const registry = new WebMCPRegistry();
    registry.registerTool(logoutTool);
    const result = await registry.executeTool('logout', {});
    expect(result.error).toBe('AUTHENTICATION_REQUIRED');
  });

  it('get_account_info is public and works without authentication', async () => {
    const registry = new WebMCPRegistry();
    registry.registerTool(getAccountInfoTool);
    mockFetch(guestMe);
    const result = await registry.executeTool('get_account_info', {});
    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(false);
  });
});
