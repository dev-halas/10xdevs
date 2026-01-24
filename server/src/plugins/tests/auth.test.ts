import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthHelpers, registerAuthPlugin } from '../auth';
import jwt from 'jsonwebtoken';
import { isBlacklisted } from '../../utils/redis';
import { JWT_SECRET } from '../../utils/config';

vi.mock('jsonwebtoken');
vi.mock('../../utils/redis');
vi.mock('../../utils/config', () => ({
  JWT_SECRET: 'test-secret',
  REDIS_URL: 'redis://localhost:6379',
  JWT_EXPIRES_IN_SECONDS: 3600,
}));

describe('AuthHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractBearerToken', () => {
    it('powinien wyciągnąć token z prawidłowego nagłówka Bearer', () => {
      const token = AuthHelpers.extractBearerToken('Bearer abc123xyz');
      expect(token).toBe('abc123xyz');
    });

    it('powinien zwrócić null dla nieprawidłowego formatu', () => {
      expect(AuthHelpers.extractBearerToken('InvalidFormat abc123')).toBeNull();
      expect(AuthHelpers.extractBearerToken('Bearer')).toBeNull();
      expect(AuthHelpers.extractBearerToken('Bearer token extra')).toBeNull();
    });

    it('powinien zwrócić null dla undefined', () => {
      expect(AuthHelpers.extractBearerToken(undefined)).toBeNull();
    });

    it('powinien zwrócić null dla nie-string wartości', () => {
      expect(AuthHelpers.extractBearerToken(123 as any)).toBeNull();
      expect(AuthHelpers.extractBearerToken(null as any)).toBeNull();
    });

    it('powinien być case-insensitive dla "Bearer"', () => {
      expect(AuthHelpers.extractBearerToken('bearer abc123')).toBe('abc123');
      expect(AuthHelpers.extractBearerToken('BEARER abc123')).toBe('abc123');
    });
  });

  describe('verifyToken', () => {
    it('powinien zwrócić userId dla prawidłowego tokena', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user-123';
      
      vi.mocked(isBlacklisted).mockResolvedValue(false);
      vi.mocked(jwt.verify).mockReturnValue({ sub: mockUserId } as any);

      const userId = await AuthHelpers.verifyToken(mockToken);

      expect(userId).toBe(mockUserId);
      expect(isBlacklisted).toHaveBeenCalledWith(mockToken);
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, JWT_SECRET);
    });

    it('powinien zwrócić null dla tokena na blackliście', async () => {
      const mockToken = 'blacklisted-token';
      
      vi.mocked(isBlacklisted).mockResolvedValue(true);

      const userId = await AuthHelpers.verifyToken(mockToken);

      expect(userId).toBeNull();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('powinien zwrócić null dla nieprawidłowego tokena', async () => {
      const mockToken = 'invalid-token';
      
      vi.mocked(isBlacklisted).mockResolvedValue(false);
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const userId = await AuthHelpers.verifyToken(mockToken);

      expect(userId).toBeNull();
    });

    it('powinien zwrócić null gdy brak sub w payload', async () => {
      const mockToken = 'token-without-sub';
      
      vi.mocked(isBlacklisted).mockResolvedValue(false);
      vi.mocked(jwt.verify).mockReturnValue({} as any);

      const userId = await AuthHelpers.verifyToken(mockToken);

      expect(userId).toBeNull();
    });
  });

  describe('setUserContext', () => {
    it('powinien ustawić ID użytkownika w kontekście żądania', async () => {
      const mockRequest: any = { user: undefined };
      const userId = 'user-123';

      await AuthHelpers.setUserContext(mockRequest, userId);

      expect(mockRequest.user).toEqual({ id: userId });
    });

    it('powinien nadpisać istniejący kontekst użytkownika', async () => {
      const mockRequest: any = { user: { id: 'old-user' } };
      const userId = 'new-user-123';

      await AuthHelpers.setUserContext(mockRequest, userId);

      expect(mockRequest.user).toEqual({ id: userId });
    });
  });
});

describe('registerAuthPlugin', () => {
  let mockApp: any;
  let preHandlerCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockApp = {
      addHook: vi.fn((hookName, callback) => {
        if (hookName === 'preHandler') {
          preHandlerCallback = callback;
        }
      }),
    };
  });

  it('powinien zarejestrować hook preHandler', () => {
    registerAuthPlugin(mockApp);

    expect(mockApp.addHook).toHaveBeenCalledWith('preHandler', expect.any(Function));
  });

  it('powinien ustawić kontekst użytkownika dla prawidłowego tokena', async () => {
    registerAuthPlugin(mockApp);

    const mockRequest: any = {
      headers: { authorization: 'Bearer valid-token' },
      user: undefined,
    };

    vi.mocked(isBlacklisted).mockResolvedValue(false);
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-123' } as any);

    await preHandlerCallback(mockRequest);

    expect(mockRequest.user).toEqual({ id: 'user-123' });
  });

  it('nie powinien ustawić kontekstu gdy brak tokena', async () => {
    registerAuthPlugin(mockApp);

    const mockRequest: any = {
      headers: {},
      user: undefined,
    };

    await preHandlerCallback(mockRequest);

    expect(mockRequest.user).toBeUndefined();
  });

  it('nie powinien ustawić kontekstu dla nieprawidłowego tokena', async () => {
    registerAuthPlugin(mockApp);

    const mockRequest: any = {
      headers: { authorization: 'Bearer invalid-token' },
      user: undefined,
    };

    vi.mocked(isBlacklisted).mockResolvedValue(false);
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await preHandlerCallback(mockRequest);

    expect(mockRequest.user).toBeUndefined();
  });
});
