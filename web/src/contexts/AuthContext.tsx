"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, refreshTokenId: string, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Sprawdź czy użytkownik jest zalogowany przy starcie aplikacji
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        
        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Błąd podczas sprawdzania autoryzacji:', error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, refreshToken: string, refreshTokenId: string, user: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('refreshTokenId', refreshTokenId);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = async () => {
    try {
      const refreshTokenId = localStorage.getItem('refreshTokenId');
      const accessToken = localStorage.getItem('accessToken');
      
      // Wywołaj endpoint wylogowania na serwerze
      if (refreshTokenId && accessToken) {
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshTokenId }),
        });
      }
    } catch (error) {
      console.error('Błąd podczas wylogowania:', error);
    } finally {
      // Wyczyść dane lokalnie niezależnie od wyniku
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('refreshTokenId');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedRefreshTokenId = localStorage.getItem('refreshTokenId');
      const accessToken = localStorage.getItem('accessToken');

      if (!storedRefreshToken || !storedRefreshTokenId || !accessToken) {
        return false;
      }

      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          refreshTokenId: storedRefreshTokenId,
          refreshToken: storedRefreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Zaktualizuj tokeny
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('refreshTokenId', data.refreshTokenId);

      return true;
    } catch (error) {
      console.error('Błąd podczas odświeżania tokenu:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  return context;
}
