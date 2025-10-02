"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import {
  type User,
  type LoginData,
  type RegisterData,
  type AuthContextType,
} from '../utils/types';

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

  const login = async (loginData: LoginData) => {
    try {
      const result = await authService.login(loginData);
      
      // Zapisz tokeny i dane użytkownika
      localStorage.setItem('accessToken', result.tokens.token);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      localStorage.setItem('refreshTokenId', result.tokens.refreshTokenId);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setUser(result.user);
    } catch (error) {
      console.error('Błąd podczas logowania:', error);
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const user = await authService.register(registerData);
      
      // Po udanej rejestracji ustaw użytkownika (ale bez tokenów)
      setUser(user);
    } catch (error) {
      console.error('Błąd podczas rejestracji:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshTokenId = localStorage.getItem('refreshTokenId');
      if (refreshTokenId) {
        await authService.logout(refreshTokenId);
      }
    } catch (error) {
      console.error('Błąd podczas wylogowania:', error);
      throw error;
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
      // Przepuść refreshToken przez axios interceptor
      // Mock request który uruchomi refresh w axios wrapperze
      const refreshTokenId = localStorage.getItem('refreshTokenId');
      const refreshTokenVal = localStorage.getItem('refreshToken');
      
      if (refreshTokenId && refreshTokenVal) {
        await authService.refreshToken({ refreshTokenId, refreshToken: refreshTokenVal });
        return true;
      }
      return false;
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
    register,
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