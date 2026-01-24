import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/auth.service';
import type { User, LoginData, RegisterData } from '../../utils/types';

// Extend Window interface for test results
declare global {
  interface Window {
    refreshResult?: boolean;
  }
}

// Mock authService
vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Mock console methods to avoid cluttering test output
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('AuthProvider - Initial State', () => {
    it('powinien zainicjalizować z pustym stanem użytkownika', async () => {
      const TestComponent = () => {
        const { user, isAuthenticated, isLoading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user ? 'logged-in' : 'logged-out'}</span>
            <span data-testid="auth">{isAuthenticated ? 'true' : 'false'}</span>
            <span data-testid="loading">{isLoading ? 'true' : 'false'}</span>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('logged-out');
      expect(screen.getByTestId('auth').textContent).toBe('false');
    });

    it('powinien przywrócić użytkownika z localStorage przy starcie', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('accessToken', 'test-token');

      const TestComponent = () => {
        const { user, isAuthenticated, isLoading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user?.email || 'logged-out'}</span>
            <span data-testid="auth">{isAuthenticated ? 'true' : 'false'}</span>
            <span data-testid="loading">{isLoading ? 'true' : 'false'}</span>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('auth').textContent).toBe('true');
    });

    it('powinien wyczyścić localStorage gdy dane użytkownika są nieprawidłowe', async () => {
      localStorage.setItem('user', 'invalid-json{');
      localStorage.setItem('accessToken', 'test-token');

      const TestComponent = () => {
        const { user, isLoading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user ? 'logged-in' : 'logged-out'}</span>
            <span data-testid="loading">{isLoading ? 'true' : 'false'}</span>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('logged-out');
      expect(localStorage.getItem('user')).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('powinien pomyślnie zalogować użytkownika', async () => {
      const loginData: LoginData = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
      };

      const mockLoginResponse = {
        user: mockUser,
        tokens: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          refreshTokenId: 'refresh-id',
        },
      };

      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

      const TestComponent = () => {
        const { user, login, isAuthenticated } = useAuth();
        
        const handleLogin = async () => {
          await login(loginData);
        };

        return (
          <div>
            <span data-testid="user">{user?.email || 'logged-out'}</span>
            <span data-testid="auth">{isAuthenticated ? 'true' : 'false'}</span>
            <button onClick={handleLogin} data-testid="login-btn">Login</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('logged-out');
      });

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });

      expect(screen.getByTestId('auth').textContent).toBe('true');
      expect(authService.login).toHaveBeenCalledWith(loginData);
      expect(localStorage.getItem('accessToken')).toBe('access-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
      expect(localStorage.getItem('refreshTokenId')).toBe('refresh-id');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('powinien propagować błąd przy nieudanym logowaniu', async () => {
      const loginData: LoginData = {
        identifier: 'test@example.com',
        password: 'wrong-password',
      };

      const error = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(error);

      const TestComponent = () => {
        const { login } = useAuth();
        
        const handleLogin = async () => {
          try {
            await login(loginData);
          } catch {
            // Error is expected
          }
        };

        return <button onClick={handleLogin} data-testid="login-btn">Login</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(loginData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Błąd podczas logowania:', error);
    });
  });

  describe('register', () => {
    it('powinien pomyślnie zarejestrować użytkownika', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        phone: '+48123456789',
        password: 'password123',
      };

      const mockUser: User = {
        id: 'user-456',
        email: 'newuser@example.com',
        phone: '+48123456789',
      };

      vi.mocked(authService.register).mockResolvedValue(mockUser);

      const TestComponent = () => {
        const { user, register } = useAuth();
        
        const handleRegister = async () => {
          await register(registerData);
        };

        return (
          <div>
            <span data-testid="user">{user?.email || 'not-registered'}</span>
            <button onClick={handleRegister} data-testid="register-btn">Register</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('not-registered');
      });

      await act(async () => {
        screen.getByTestId('register-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('newuser@example.com');
      });

      expect(authService.register).toHaveBeenCalledWith(registerData);
    });

    it('powinien propagować błąd przy nieudanej rejestracji', async () => {
      const registerData: RegisterData = {
        email: 'invalid@example.com',
        phone: 'invalid',
        password: '123',
      };

      const error = new Error('Validation failed');
      vi.mocked(authService.register).mockRejectedValue(error);

      const TestComponent = () => {
        const { register } = useAuth();
        
        const handleRegister = async () => {
          try {
            await register(registerData);
          } catch {
            // Error is expected
          }
        };

        return <button onClick={handleRegister} data-testid="register-btn">Register</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('register-btn').click();
      });

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(registerData);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Błąd podczas rejestracji:', error);
    });
  });

  describe('logout', () => {
    it('powinien pomyślnie wylogować użytkownika', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('refreshTokenId', 'refresh-id');

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const TestComponent = () => {
        const { user, logout, isAuthenticated } = useAuth();
        
        const handleLogout = async () => {
          await logout();
        };

        return (
          <div>
            <span data-testid="user">{user?.email || 'logged-out'}</span>
            <span data-testid="auth">{isAuthenticated ? 'true' : 'false'}</span>
            <button onClick={handleLogout} data-testid="logout-btn">Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('logged-out');
      });

      expect(screen.getByTestId('auth').textContent).toBe('false');
      expect(authService.logout).toHaveBeenCalledWith('refresh-id');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('refreshTokenId')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('powinien wyczyścić dane lokalnie nawet przy błędzie API', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshTokenId', 'refresh-id');

      const error = new Error('Logout failed');
      vi.mocked(authService.logout).mockRejectedValue(error);

      const TestComponent = () => {
        const { user, logout } = useAuth();
        
        const handleLogout = async () => {
          try {
            await logout();
          } catch {
            // Error is expected but should still clear local state
          }
        };

        return (
          <div>
            <span data-testid="user">{user?.email || 'logged-out'}</span>
            <button onClick={handleLogout} data-testid="logout-btn">Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('logged-out');
      });

      expect(localStorage.getItem('user')).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Błąd podczas wylogowania:', error);
    });

    it('powinien działać gdy nie ma refreshTokenId', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('accessToken', 'test-token');

      const TestComponent = () => {
        const { user, logout } = useAuth();
        
        const handleLogout = async () => {
          await logout();
        };

        return (
          <div>
            <span data-testid="user">{user?.email || 'logged-out'}</span>
            <button onClick={handleLogout} data-testid="logout-btn">Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('logged-out');
      });

      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('powinien pomyślnie odświeżyć token', async () => {
      localStorage.setItem('refreshTokenId', 'refresh-id');
      localStorage.setItem('refreshToken', 'refresh-token');

      const mockTokens = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
        refreshTokenId: 'new-refresh-id',
      };

      vi.mocked(authService.refreshToken).mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { refreshToken } = useAuth();
        
        const handleRefresh = async () => {
          const result = await refreshToken();
          return result;
        };

        return (
          <button onClick={async () => {
            const result = await handleRefresh();
            window.refreshResult = result;
          }} data-testid="refresh-btn">
            Refresh
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeDefined();
      });

      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalledWith({
          refreshTokenId: 'refresh-id',
          refreshToken: 'refresh-token',
        });
      });

      expect(window.refreshResult).toBe(true);
    });

    it('powinien zwrócić false gdy brak tokenów', async () => {
      const TestComponent = () => {
        const { refreshToken } = useAuth();
        
        const handleRefresh = async () => {
          const result = await refreshToken();
          return result;
        };

        return (
          <button onClick={async () => {
            const result = await handleRefresh();
            window.refreshResult = result;
          }} data-testid="refresh-btn">
            Refresh
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeDefined();
      });

      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      await waitFor(() => {
        expect(window.refreshResult).toBe(false);
      });

      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('powinien zwrócić false przy błędzie odświeżania', async () => {
      localStorage.setItem('refreshTokenId', 'refresh-id');
      localStorage.setItem('refreshToken', 'refresh-token');

      const error = new Error('Refresh failed');
      vi.mocked(authService.refreshToken).mockRejectedValue(error);

      const TestComponent = () => {
        const { refreshToken } = useAuth();
        
        const handleRefresh = async () => {
          const result = await refreshToken();
          return result;
        };

        return (
          <button onClick={async () => {
            const result = await handleRefresh();
            window.refreshResult = result;
          }} data-testid="refresh-btn">
            Refresh
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeDefined();
      });

      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      await waitFor(() => {
        expect(window.refreshResult).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Błąd podczas odświeżania tokenu:', error);
    });
  });

  describe('useAuth hook', () => {
    it('powinien rzucić błąd gdy używany poza AuthProvider', () => {
      const TestComponent = () => {
        useAuth();
        return <div>Test</div>;
      };

      // Suppress console.error for this test since we expect an error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth musi być używany wewnątrz AuthProvider');

      consoleError.mockRestore();
    });
  });
});
