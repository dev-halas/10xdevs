import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import { apiClient } from '../../utils/api-client';
import type {
  LoginData,
  RegisterData,
  ResetPasswordData,
  ResetPasswordConfirmData,
  VerifyEmailData,
  RefreshTokenData,
  User,
  AuthTokens,
} from '../../utils/types';

vi.mock('../../utils/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('powinien pomyślnie zalogować użytkownika i przekształcić odpowiedź', async () => {
      const loginData: LoginData = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      const mockServerResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          phone: '+48123456789',
        },
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
        refreshTokenId: 'refresh-id-123',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockServerResponse);

      const result = await authService.login(loginData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual({
        tokens: {
          token: 'access-token-123',
          refreshToken: 'refresh-token-123',
          refreshTokenId: 'refresh-id-123',
        },
        user: mockServerResponse.user,
      });
    });

    it('powinien propagować błąd przy nieudanym logowaniu', async () => {
      const loginData: LoginData = {
        identifier: 'test@example.com',
        password: 'wrong-password',
      };

      const error = new Error('Invalid credentials');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
    });
  });

  describe('register', () => {
    it('powinien pomyślnie zarejestrować nowego użytkownika', async () => {
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

      vi.mocked(apiClient.post).mockResolvedValue(mockUser);

      const result = await authService.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockUser);
    });

    it('powinien propagować błąd walidacji przy rejestracji', async () => {
      const registerData: RegisterData = {
        email: 'invalid-email',
        phone: '',
        password: '123',
      };

      const error = new Error('Validation failed');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.register(registerData)).rejects.toThrow('Validation failed');
    });
  });

  describe('requestPasswordReset', () => {
    it('powinien pomyślnie wysłać żądanie resetu hasła', async () => {
      const resetData: ResetPasswordData = {
        email: 'test@example.com',
      };

      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await authService.requestPasswordReset(resetData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', resetData);
    });

    it('powinien propagować błąd przy nieudanym żądaniu resetu hasła', async () => {
      const resetData: ResetPasswordData = {
        email: 'nonexistent@example.com',
      };

      const error = new Error('User not found');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.requestPasswordReset(resetData)).rejects.toThrow('User not found');
    });
  });

  describe('confirmPasswordReset', () => {
    it('powinien pomyślnie potwierdzić reset hasła', async () => {
      const confirmData: ResetPasswordConfirmData = {
        token: 'reset-token-123',
        password: 'newPassword123',
      };

      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await authService.confirmPasswordReset(confirmData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password/confirm', confirmData);
    });

    it('powinien propagować błąd przy nieprawidłowym tokenie resetu', async () => {
      const confirmData: ResetPasswordConfirmData = {
        token: 'invalid-token',
        password: 'newPassword123',
      };

      const error = new Error('Invalid or expired token');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.confirmPasswordReset(confirmData)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('verifyEmail', () => {
    it('powinien pomyślnie zweryfikować adres email', async () => {
      const verifyData: VerifyEmailData = {
        token: 'verify-token-123',
      };

      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await authService.verifyEmail(verifyData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', verifyData);
    });

    it('powinien propagować błąd przy nieprawidłowym tokenie weryfikacji', async () => {
      const verifyData: VerifyEmailData = {
        token: 'invalid-token',
      };

      const error = new Error('Invalid verification token');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.verifyEmail(verifyData)).rejects.toThrow('Invalid verification token');
    });
  });

  describe('refreshToken', () => {
    it('powinien pomyślnie odświeżyć tokeny dostępu', async () => {
      const refreshData: RefreshTokenData = {
        refreshTokenId: 'refresh-id-123',
        refreshToken: 'refresh-token-123',
      };

      const mockTokens: AuthTokens = {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
        refreshTokenId: 'new-refresh-id',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockTokens);

      const result = await authService.refreshToken(refreshData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', refreshData);
      expect(result).toEqual(mockTokens);
    });

    it('powinien propagować błąd przy nieprawidłowym refresh tokenie', async () => {
      const refreshData: RefreshTokenData = {
        refreshTokenId: 'invalid-id',
        refreshToken: 'invalid-token',
      };

      const error = new Error('Invalid refresh token');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.refreshToken(refreshData)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('powinien pomyślnie wylogować użytkownika', async () => {
      const refreshTokenId = 'refresh-id-123';

      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await authService.logout(refreshTokenId);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', { refreshTokenId });
    });

    it('powinien propagować błąd przy nieudanym wylogowaniu', async () => {
      const refreshTokenId = 'invalid-id';

      const error = new Error('Logout failed');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.logout(refreshTokenId)).rejects.toThrow('Logout failed');
    });
  });
});
