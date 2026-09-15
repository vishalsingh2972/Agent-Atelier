'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { webmcpRegistry } from '@/webmcp/registry';
import { registerAllWebMCPTools } from '@/webmcp';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const authRequestVersion = useRef(0);

  const checkCurrentUser = async () => {
    const requestVersion = ++authRequestVersion.current;
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (requestVersion !== authRequestVersion.current) return;
      if (data.success && data.authenticated && data.user) {
        setUser(data.user);
        webmcpRegistry.setAuthState(true, data.user);
      } else {
        setUser(null);
        webmcpRegistry.setAuthState(false, null);
      }
    } catch {
      if (requestVersion !== authRequestVersion.current) return;
      setUser(null);
      webmcpRegistry.setAuthState(false, null);
    } finally {
      if (requestVersion === authRequestVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    // Register all tools on initial client mount
    try {
      registerAllWebMCPTools();
    } catch (err) {
      console.warn('[WebMCP] Tool registration notice:', err);
    }
    checkCurrentUser();

    // Listen for WebMCP auth tool events so the UI stays in sync
    const handleWebMCPAuth = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.action === 'login' && detail.user) {
        setUser(detail.user);
        setLoading(false);
        setIsAuthModalOpen(false);
      } else if (detail?.action === 'logout') {
        setUser(null);
        setLoading(false);
      }
    };
    window.addEventListener('webmcp-auth-change', handleWebMCPAuth);
    return () => window.removeEventListener('webmcp-auth-change', handleWebMCPAuth);
  }, []);

  const login = async (email: string, password: string) => {
    ++authRequestVersion.current;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setLoading(false);
        webmcpRegistry.setAuthState(true, data.user);
        setIsAuthModalOpen(false);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login error' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    ++authRequestVersion.current;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setLoading(false);
        webmcpRegistry.setAuthState(true, data.user);
        setIsAuthModalOpen(false);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Registration error' };
    }
  };

  const logout = async () => {
    ++authRequestVersion.current;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setLoading(false);
      webmcpRegistry.setAuthState(false, null);
    }
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshUser = async () => {
    await checkCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalTab,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
