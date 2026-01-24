import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthMiddleware, AuthUtils } from '../auth';
import { createResponseBuilder } from '../../utils/core/api-standards';

vi.mock('../../utils/core/api-standards');

describe('AuthMiddleware', () => {
  let mockRequest: any;
  let mockReply: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      user: undefined,
    };
    
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    
    mockResponse = {
      unauthorized: vi.fn().mockImplementation((msg) => {
        const error = new Error(msg);
        error.name = 'UnauthorizedError';
        throw error;
      }),
    };
    
    vi.mocked(createResponseBuilder).mockReturnValue(mockResponse);
  });

  describe('requireAuth', () => {
    it('powinien przepuścić żądanie z zalogowanym użytkownikiem', async () => {
      mockRequest.user = { id: 'user-123' };

      await expect(
        AuthMiddleware.requireAuth(mockRequest, mockReply)
      ).resolves.toBeUndefined();
      
      expect(mockResponse.unauthorized).not.toHaveBeenCalled();
    });

    it('powinien rzucić błąd gdy użytkownik nie jest zalogowany', async () => {
      mockRequest.user = undefined;

      await expect(
        AuthMiddleware.requireAuth(mockRequest, mockReply)
      ).rejects.toThrow('Wymagane zalogowanie');
      
      expect(mockResponse.unauthorized).toHaveBeenCalledWith('Wymagane zalogowanie');
    });

    it('powinien rzucić błąd gdy user istnieje ale bez ID', async () => {
      mockRequest.user = { email: 'test@example.com' };

      await expect(
        AuthMiddleware.requireAuth(mockRequest, mockReply)
      ).rejects.toThrow();
    });
  });

  describe('requireAdmin', () => {
    it('powinien przepuścić żądanie z zalogowanym użytkownikiem', async () => {
      mockRequest.user = { id: 'admin-123' };

      await expect(
        AuthMiddleware.requireAdmin(mockRequest, mockReply)
      ).resolves.toBeUndefined();
    });

    it('powinien rzucić błąd gdy użytkownik nie jest zalogowany', async () => {
      mockRequest.user = undefined;

      await expect(
        AuthMiddleware.requireAdmin(mockRequest, mockReply)
      ).rejects.toThrow('Wymagane zalogowanie');
    });
  });
});

describe('AuthUtils', () => {
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
    };
  });

  describe('isAuthenticated', () => {
    it('powinien zwrócić true dla zalogowanego użytkownika', () => {
      mockRequest.user = { id: 'user-123' };
      
      expect(AuthUtils.isAuthenticated(mockRequest)).toBe(true);
    });

    it('powinien zwrócić false gdy brak użytkownika', () => {
      mockRequest.user = undefined;
      
      expect(AuthUtils.isAuthenticated(mockRequest)).toBe(false);
    });

    it('powinien zwrócić false gdy user bez ID', () => {
      mockRequest.user = { email: 'test@example.com' };
      
      expect(AuthUtils.isAuthenticated(mockRequest)).toBe(false);
    });
  });

  describe('getUserId', () => {
    it('powinien zwrócić ID użytkownika', () => {
      mockRequest.user = { id: 'user-123' };
      
      expect(AuthUtils.getUserId(mockRequest)).toBe('user-123');
    });

    it('powinien zwrócić null gdy brak użytkownika', () => {
      mockRequest.user = undefined;
      
      expect(AuthUtils.getUserId(mockRequest)).toBeNull();
    });

    it('powinien zwrócić null gdy user bez ID', () => {
      mockRequest.user = { email: 'test@example.com' };
      
      expect(AuthUtils.getUserId(mockRequest)).toBeNull();
    });
  });

  describe('requireUserId', () => {
    it('powinien zwrócić ID użytkownika', () => {
      mockRequest.user = { id: 'user-123' };
      
      expect(AuthUtils.requireUserId(mockRequest)).toBe('user-123');
    });

    it('powinien rzucić błąd gdy brak użytkownika', () => {
      mockRequest.user = undefined;
      
      expect(() => AuthUtils.requireUserId(mockRequest)).toThrow(
        'User ID required but not found in request context'
      );
    });

    it('powinien rzucić błąd gdy user bez ID', () => {
      mockRequest.user = { email: 'test@example.com' };
      
      expect(() => AuthUtils.requireUserId(mockRequest)).toThrow(
        'User ID required but not found in request context'
      );
    });
  });
});
