import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ADMIN_SESSION_KEY = 'leaderboard_admin_auth_v1';

interface FirebaseContextValue {
  authReady: boolean;
  isAdmin: boolean;
  adminUsername: string | null;
  authError: string | null;
  isSigningIn: boolean;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.authenticated === true && parsed.username === 'admin') {
          setIsAdmin(true);
          setAdminUsername(parsed.username);
        }
      }
    } catch {
      // Ignore corrupt session storage
    } finally {
      setAuthReady(true);
    }
  }, []);

  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    setIsSigningIn(true);
    setAuthError(null);
    const cleanUser = username.trim();

    try {
      let authenticated = false;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, password }),
        });
        if (res.ok) {
          authenticated = true;
        } else if (res.status === 401) {
          setAuthError('Usuario o contraseña incorrectos.');
          return;
        }
      } catch {
        // Fallback when offline/static
        authenticated = cleanUser === 'admin' && password === 'admin';
      }

      if (!authenticated) {
        setAuthError('Usuario o contraseña incorrectos.');
        return;
      }

      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({ authenticated: true, username: cleanUser })
      );
      setIsAdmin(true);
      setAdminUsername(cleanUser);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthError(null);
    setIsAdmin(false);
    setAdminUsername(null);
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        authReady,
        isAdmin,
        adminUsername,
        authError,
        isSigningIn,
        loginWithCredentials,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase debe usarse dentro de FirebaseProvider');
  }
  return ctx;
}
