import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthStatus } from '../types';


interface User {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'loading',
  login: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // Check for persisted session (Mocking a JWT token check)
    const storedUser = localStorage.getItem('socially_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setStatus('authenticated');
      } catch (e) {
        setStatus('unauthenticated');
      }
    } else {
      setStatus('unauthenticated');
    }
  }, []);


  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('socially_session', JSON.stringify(userData));
    setStatus('authenticated');
  };

  const logout = async () => {
    // Clear all storage and cookies for a full logout
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    setUser(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};