import { WebMCPTool } from '../types';
import { webmcpRegistry } from '../registry';

export const loginTool: WebMCPTool = {
  name: 'login',
  description:
    'Authenticate a user with their email address and password. ' +
    'Use this when the user wants to sign in, or when a protected tool returns AUTHENTICATION_REQUIRED. ' +
    'Returns the authenticated user profile on success, or an error message for invalid credentials. ' +
    'After a successful login, previously unavailable authenticated tools become available.',
  category: 'Auth',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'User email address (e.g. "demo@agentbridge.io").',
      },
      password: {
        type: 'string',
        description: 'User password.',
      },
    },
    required: ['email', 'password'],
  },
  execute: async ({ email, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      webmcpRegistry.setAuthState(true, data.user);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('webmcp-auth-change', { detail: { action: 'login', user: data.user } }));
      }
    }
    return data;
  },
};

export const registerTool: WebMCPTool = {
  name: 'register',
  description:
    'Create a new user account with a name, email, and password. ' +
    'Use this when the user wants to sign up for a new account. ' +
    'Returns the newly created user profile on success. ' +
    'The user is automatically logged in after registration, making authenticated tools available.',
  category: 'Auth',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Full name for the new account.',
      },
      email: {
        type: 'string',
        description: 'Email address for the new account.',
      },
      password: {
        type: 'string',
        description: 'Password for the new account (minimum 6 characters).',
      },
    },
    required: ['name', 'email', 'password'],
  },
  execute: async ({ name, email, password }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      webmcpRegistry.setAuthState(true, data.user);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('webmcp-auth-change', { detail: { action: 'login', user: data.user } }));
      }
    }
    return data;
  },
};

export const logoutTool: WebMCPTool = {
  name: 'logout',
  description:
    'Sign out the currently authenticated user and end the session. ' +
    'Use this when the user requests to log out. ' +
    'After logout, authenticated tools (cart, wishlist, orders) become unavailable. ' +
    'Returns a confirmation of successful logout.',
  category: 'Auth',
  permission: 'AUTHENTICATED',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    webmcpRegistry.setAuthState(false, null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('webmcp-auth-change', { detail: { action: 'logout' } }));
    }
    return { success: true, message: 'Successfully logged out.' };
  },
};

export const getAccountInfoTool: WebMCPTool = {
  name: 'get_account_info',
  description:
    'Check the current authentication status and retrieve the logged-in user profile. ' +
    'Use this to determine whether the user is signed in before attempting protected operations. ' +
    'Returns the user profile (id, name, email, role) if authenticated, or an unauthenticated status.',
  category: 'Auth',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.success && data.authenticated && data.user) {
      return {
        success: true,
        authenticated: true,
        user: data.user,
      };
    }
    return {
      success: true,
      authenticated: false,
      message: 'No user is currently logged in. Use the login or register tool to authenticate.',
    };
  },
};
