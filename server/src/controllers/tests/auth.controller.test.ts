import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { createResponseBuilder } from '../../utils/core/api-standards';
import { handleError } from '../../utils/error-handler';

vi.mock('../../services/auth.service');
vi.mock('../../utils/core/api-standards');
vi.mock('../../utils/error-handler');

describe('AuthController', () => {
  let mockRequest: any;
  let mockReply: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      body: {},
      headers: {},
      user: { id: 'user-123' },
    };
    
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    
    mockResponse = {
      created: vi.fn().mockReturnValue({ success: true }),
      ok: vi.fn().mockReturnValue({ success: true }),
    };
    
    vi.mocked(createResponseBuilder).mockReturnValue(mockResponse);
  });

  describe('register', () => {
    it('powinien pomyślnie zarejestrować użytkownika', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      
      vi.mocked(AuthService.register).mockResolvedValue({ user: mockUser } as any);

      await AuthController.register(mockRequest, mockReply);

      expect(AuthService.register).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.created).toHaveBeenCalledWith(mockUser, 'User successfully registered');
    });

    it('powinien obsłużyć błąd podczas rejestracji', async () => {
      const error = new Error('Registration failed');
      vi.mocked(AuthService.register).mockRejectedValue(error);

      await AuthController.register(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('login', () => {
    it('powinien pomyślnie zalogować użytkownika', async () => {
      const mockLoginData = { accessToken: 'token-123', user: { id: 'user-123' } };
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      
      vi.mocked(AuthService.login).mockResolvedValue(mockLoginData as any);

      await AuthController.login(mockRequest, mockReply);

      expect(AuthService.login).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.ok).toHaveBeenCalledWith(mockLoginData, 'Login successful');
    });

    it('powinien obsłużyć błąd podczas logowania', async () => {
      const error = new Error('Login failed');
      vi.mocked(AuthService.login).mockRejectedValue(error);

      await AuthController.login(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('logout', () => {
    it('powinien pomyślnie wylogować użytkownika', async () => {
      mockRequest.body = { refreshTokenId: 'token-123' };
      vi.mocked(AuthService.logout).mockResolvedValue({ ok: true });

      await AuthController.logout(mockRequest, mockReply);

      expect(AuthService.logout).toHaveBeenCalledWith('user-123', mockRequest.body);
      expect(mockResponse.ok).toHaveBeenCalledWith(null, 'Logged out');
    });

    it('powinien obsłużyć błąd podczas wylogowania', async () => {
      const error = new Error('Logout failed');
      vi.mocked(AuthService.logout).mockRejectedValue(error);

      await AuthController.logout(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('refresh', () => {
    it('powinien pomyślnie odświeżyć token', async () => {
      const mockRefreshData = { accessToken: 'new-token-123' };
      mockRequest.headers.authorization = 'Bearer old-token-123';
      mockRequest.body = { refreshTokenId: 'refresh-123', refreshToken: 'refresh-token' };
      
      vi.mocked(AuthService.refresh).mockResolvedValue(mockRefreshData as any);

      await AuthController.refresh(mockRequest, mockReply);

      expect(AuthService.refresh).toHaveBeenCalledWith({
        userId: 'user-123',
        refreshTokenId: 'refresh-123',
        refreshToken: 'refresh-token',
        oldAccessToken: 'old-token-123',
      });
      expect(mockResponse.ok).toHaveBeenCalledWith(mockRefreshData, 'Token refreshed');
    });

    it('powinien obsłużyć błąd podczas odświeżania tokena', async () => {
      const error = new Error('Refresh failed');
      vi.mocked(AuthService.refresh).mockRejectedValue(error);

      await AuthController.refresh(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });
});
