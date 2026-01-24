import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { prisma } from '../../utils/db';
import { 
  ValidationSchemas,
  DataNormalizers,
  PasswordHelpers,
  TokenHelpers,
  UserHelpers,
} from '../../utils/helpers/auth-helpers';
import { addToBlacklist } from '../../utils/redis';
import { ErrorFactory } from '../../utils/error-handler';

vi.mock('../../utils/db', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../utils/helpers/auth-helpers', () => {
  const logoutSchemaMock: any = {
    parse: vi.fn(),
    refine: vi.fn(),
  };
  logoutSchemaMock.refine.mockReturnValue(logoutSchemaMock);
  
  return {
    ValidationSchemas: {
      register: { parse: vi.fn() },
      login: { parse: vi.fn() },
      logout: logoutSchemaMock,
      refresh: { parse: vi.fn() },
    },
  DataNormalizers: {
    email: vi.fn((val) => val),
    phone: vi.fn((val) => val),
    identifier: vi.fn(),
  },
  PasswordHelpers: {
    hash: vi.fn(),
    verify: vi.fn(),
  },
  TokenHelpers: {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
  },
    UserHelpers: {
      createPublicUser: vi.fn(),
    },
  };
});

vi.mock('../../utils/redis', () => ({
  addToBlacklist: vi.fn(),
}));

vi.mock('../../utils/error-handler', () => ({
  ErrorFactory: {
    unauthorized: vi.fn((msg) => new Error(msg)),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('powinien pomyślnie zarejestrować nowego użytkownika', async () => {
      const input = {
        email: 'test@example.com',
        phone: '+48123456789',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
        createdAt: new Date(),
      };

      vi.mocked(ValidationSchemas.register.parse).mockReturnValue(input);
      vi.mocked(DataNormalizers.email).mockReturnValue(input.email);
      vi.mocked(DataNormalizers.phone).mockReturnValue(input.phone);
      vi.mocked(PasswordHelpers.hash).mockResolvedValue('hashed-password');
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await AuthService.register(input);

      expect(ValidationSchemas.register.parse).toHaveBeenCalledWith(input);
      expect(PasswordHelpers.hash).toHaveBeenCalledWith(input.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: input.email,
          phone: input.phone,
          passwordHash: 'hashed-password',
        },
        select: { id: true, email: true, phone: true, createdAt: true },
      });
      expect(result).toEqual({ user: mockUser });
    });

    it('powinien propagować błąd walidacji', async () => {
      const input = { email: 'invalid', phone: '', password: '123' };
      const error = new Error('Validation failed');

      vi.mocked(ValidationSchemas.register.parse).mockImplementation(() => {
        throw error;
      });

      await expect(AuthService.register(input)).rejects.toThrow('Validation failed');
    });
  });

  describe('login', () => {
    it('powinien pomyślnie zalogować użytkownika przez email', async () => {
      const input = { identifier: 'test@example.com', password: 'password123' };
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
        passwordHash: 'hashed-password',
      };

      const mockPublicUser = { id: 'user-123', email: 'test@example.com' };

      vi.mocked(ValidationSchemas.login.parse).mockReturnValue(input);
      vi.mocked(DataNormalizers.identifier).mockReturnValue({
        isEmail: true,
        normalized: 'test@example.com',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(PasswordHelpers.verify).mockResolvedValue(true);
      vi.mocked(TokenHelpers.generateAccessToken).mockReturnValue('access-token');
      vi.mocked(TokenHelpers.generateRefreshToken).mockResolvedValue({
        id: 'refresh-id',
        token: 'refresh-token',
      } as any);
      vi.mocked(UserHelpers.createPublicUser).mockReturnValue(mockPublicUser as any);

      const result = await AuthService.login(input);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, email: true, phone: true, passwordHash: true },
      });
      expect(PasswordHelpers.verify).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(result).toEqual({
        user: mockPublicUser,
        token: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenId: 'refresh-id',
      });
    });

    it('powinien pomyślnie zalogować użytkownika przez telefon', async () => {
      const input = { identifier: '+48123456789', password: 'password123' };
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
        passwordHash: 'hashed-password',
      };

      vi.mocked(ValidationSchemas.login.parse).mockReturnValue(input);
      vi.mocked(DataNormalizers.identifier).mockReturnValue({
        isEmail: false,
        normalized: '+48123456789',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(PasswordHelpers.verify).mockResolvedValue(true);
      vi.mocked(TokenHelpers.generateAccessToken).mockReturnValue('access-token');
      vi.mocked(TokenHelpers.generateRefreshToken).mockResolvedValue({
        id: 'refresh-id',
        token: 'refresh-token',
      } as any);
      vi.mocked(UserHelpers.createPublicUser).mockReturnValue({} as any);

      await AuthService.login(input);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '+48123456789' },
        select: { id: true, email: true, phone: true, passwordHash: true },
      });
    });

    it('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
      const input = { identifier: 'nonexistent@example.com', password: 'password123' };

      vi.mocked(ValidationSchemas.login.parse).mockReturnValue(input);
      vi.mocked(DataNormalizers.identifier).mockReturnValue({
        isEmail: true,
        normalized: 'nonexistent@example.com',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(AuthService.login(input)).rejects.toThrow();
      expect(ErrorFactory.unauthorized).toHaveBeenCalledWith('Invalid login data');
    });

    it('powinien rzucić błąd gdy hasło jest nieprawidłowe', async () => {
      const input = { identifier: 'test@example.com', password: 'wrong-password' };
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
        passwordHash: 'hashed-password',
      };

      vi.mocked(ValidationSchemas.login.parse).mockReturnValue(input);
      vi.mocked(DataNormalizers.identifier).mockReturnValue({
        isEmail: true,
        normalized: 'test@example.com',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(PasswordHelpers.verify).mockResolvedValue(false);

      await expect(AuthService.login(input)).rejects.toThrow();
      expect(ErrorFactory.unauthorized).toHaveBeenCalledWith('Invalid login data');
    });
  });

  describe('logout', () => {
    it('powinien pomyślnie wylogować użytkownika z refreshTokenId', async () => {
      const userId = 'user-123';
      const input = { refreshTokenId: 'token-123' };

      vi.mocked(ValidationSchemas.logout.parse).mockReturnValue(input);
      vi.mocked(TokenHelpers.revokeRefreshToken).mockResolvedValue(undefined);

      const result = await AuthService.logout(userId, input);

      expect(TokenHelpers.revokeRefreshToken).toHaveBeenCalledWith(userId, 'token-123');
      expect(result).toEqual({ ok: true });
    });

    it('powinien działać bez revokowania gdy brak userId', async () => {
      const input = { refreshTokenId: 'token-123' };

      vi.mocked(ValidationSchemas.logout.parse).mockReturnValue(input);

      const result = await AuthService.logout(undefined, input);

      expect(TokenHelpers.revokeRefreshToken).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });

    it('powinien działać bez revokowania gdy brak refreshTokenId', async () => {
      const userId = 'user-123';
      const input = {};

      vi.mocked(ValidationSchemas.logout.parse).mockReturnValue(input);

      const result = await AuthService.logout(userId, input);

      expect(TokenHelpers.revokeRefreshToken).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('refresh', () => {
    it('powinien pomyślnie odświeżyć tokeny', async () => {
      const input = {
        userId: 'user-123',
        refreshTokenId: 'old-refresh-id',
        refreshToken: 'old-refresh-token',
        oldAccessToken: 'old-access-token',
      };

      vi.mocked(ValidationSchemas.refresh.parse).mockReturnValue({
        refreshTokenId: input.refreshTokenId,
        refreshToken: input.refreshToken,
      });
      vi.mocked(TokenHelpers.verifyRefreshToken).mockResolvedValue(true);
      vi.mocked(TokenHelpers.generateAccessToken).mockReturnValue('new-access-token');
      vi.mocked(TokenHelpers.generateRefreshToken).mockResolvedValue({
        id: 'new-refresh-id',
        token: 'new-refresh-token',
      } as any);
      vi.mocked(TokenHelpers.revokeRefreshToken).mockResolvedValue(undefined);
      vi.mocked(addToBlacklist).mockResolvedValue(undefined as any);

      const result = await AuthService.refresh(input);

      expect(TokenHelpers.verifyRefreshToken).toHaveBeenCalledWith(
        'user-123',
        'old-refresh-id',
        'old-refresh-token'
      );
      expect(addToBlacklist).toHaveBeenCalledWith('old-access-token', expect.any(Number));
      expect(TokenHelpers.revokeRefreshToken).toHaveBeenCalledWith('user-123', 'old-refresh-id');
      expect(result).toEqual({
        token: 'new-access-token',
        refreshTokenId: 'new-refresh-id',
        refreshToken: 'new-refresh-token',
      });
    });

    it('powinien rzucić błąd gdy brak userId', async () => {
      const input = {
        userId: '',
        refreshTokenId: 'refresh-id',
        refreshToken: 'refresh-token',
        oldAccessToken: null,
      };

      vi.mocked(ValidationSchemas.refresh.parse).mockReturnValue({
        refreshTokenId: input.refreshTokenId,
        refreshToken: input.refreshToken,
      });

      await expect(AuthService.refresh(input)).rejects.toThrow();
      expect(ErrorFactory.unauthorized).toHaveBeenCalledWith('User context not found');
    });

    it('powinien rzucić błąd gdy refresh token jest nieprawidłowy', async () => {
      const input = {
        userId: 'user-123',
        refreshTokenId: 'invalid-refresh-id',
        refreshToken: 'invalid-refresh-token',
        oldAccessToken: null,
      };

      vi.mocked(ValidationSchemas.refresh.parse).mockReturnValue({
        refreshTokenId: input.refreshTokenId,
        refreshToken: input.refreshToken,
      });
      vi.mocked(TokenHelpers.verifyRefreshToken).mockResolvedValue(false);

      await expect(AuthService.refresh(input)).rejects.toThrow();
      expect(ErrorFactory.unauthorized).toHaveBeenCalledWith('Invalid refresh token');
    });

    it('nie powinien dodawać do blacklisty gdy brak oldAccessToken', async () => {
      const input = {
        userId: 'user-123',
        refreshTokenId: 'refresh-id',
        refreshToken: 'refresh-token',
        oldAccessToken: null,
      };

      vi.mocked(ValidationSchemas.refresh.parse).mockReturnValue({
        refreshTokenId: input.refreshTokenId,
        refreshToken: input.refreshToken,
      });
      vi.mocked(TokenHelpers.verifyRefreshToken).mockResolvedValue(true);
      vi.mocked(TokenHelpers.generateAccessToken).mockReturnValue('new-access-token');
      vi.mocked(TokenHelpers.generateRefreshToken).mockResolvedValue({
        id: 'new-refresh-id',
        token: 'new-refresh-token',
      } as any);

      await AuthService.refresh(input);

      expect(addToBlacklist).not.toHaveBeenCalled();
    });
  });
});
