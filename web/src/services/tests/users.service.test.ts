import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from '../users.service';
import { apiClient } from '../../utils/api-client';
import type {
  User,
  UpdateUserProfileData,
  ChangePasswordData,
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

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('powinien pomyślnie pobrać profil użytkownika', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockUser);

      const result = await usersService.getUserProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockUser);
    });

    it('powinien propagować błąd przy nieautoryzowanym dostępie', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(usersService.getUserProfile()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateUserProfile', () => {
    it('powinien pomyślnie zaktualizować profil użytkownika', async () => {
      const updateData: UpdateUserProfileData = {
        email: 'newemail@example.com',
        phone: '+48987654321',
      };

      const mockUpdatedUser: User = {
        id: 'user-123',
        email: 'newemail@example.com',
        phone: '+48987654321',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockUpdatedUser);

      const result = await usersService.updateUserProfile(updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/users/profile', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('powinien zaktualizować tylko email', async () => {
      const updateData: UpdateUserProfileData = {
        email: 'newemail@example.com',
      };

      const mockUpdatedUser: User = {
        id: 'user-123',
        email: 'newemail@example.com',
        phone: '+48123456789',
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockUpdatedUser);

      const result = await usersService.updateUserProfile(updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/users/profile', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('powinien propagować błąd walidacji przy aktualizacji profilu', async () => {
      const updateData: UpdateUserProfileData = {
        email: 'invalid-email',
      };

      const error = new Error('Validation failed');
      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(usersService.updateUserProfile(updateData)).rejects.toThrow('Validation failed');
    });
  });

  describe('changePassword', () => {
    it('powinien pomyślnie zmienić hasło użytkownika', async () => {
      const passwordData: ChangePasswordData = {
        currentPin: 'oldPassword123',
        newPin: 'newPassword456',
      };

      vi.mocked(apiClient.put).mockResolvedValue(undefined);

      await usersService.changePassword(passwordData);

      expect(apiClient.put).toHaveBeenCalledWith('/users/change-password', passwordData);
    });

    it('powinien propagować błąd przy nieprawidłowym aktualnym haśle', async () => {
      const passwordData: ChangePasswordData = {
        currentPin: 'wrongPassword',
        newPin: 'newPassword456',
      };

      const error = new Error('Current password is incorrect');
      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(usersService.changePassword(passwordData)).rejects.toThrow('Current password is incorrect');
    });

    it('powinien propagować błąd walidacji dla słabego hasła', async () => {
      const passwordData: ChangePasswordData = {
        currentPin: 'oldPassword123',
        newPin: '123',
      };

      const error = new Error('Password is too weak');
      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(usersService.changePassword(passwordData)).rejects.toThrow('Password is too weak');
    });
  });

  describe('getUsersList', () => {
    it('powinien pomyślnie pobrać listę użytkowników z paginacją', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          phone: '+48111111111',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          phone: '+48222222222',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockUsers,
        meta: {
          timestamp: '2024-01-01T00:00:00.000Z',
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalItems: 25,
            itemsPerPage: 10,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await usersService.getUsersList(1, 10);

      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users?page=1&limit=10',
      });
      expect(result).toEqual({
        users: mockUsers,
        pagination: mockResponse.meta.pagination,
      });
    });

    it('powinien używać domyślnych wartości dla page i limit', async () => {
      const mockUsers: User[] = [];
      const mockResponse = {
        success: true,
        data: mockUsers,
        meta: undefined,
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await usersService.getUsersList();

      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/users?page=1&limit=10',
      });
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('powinien używać domyślnej paginacji gdy brak meta w odpowiedzi', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          phone: '+48111111111',
        },  
      ];

      const mockResponse = {
        success: true,
        data: mockUsers,
        meta: undefined,
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await usersService.getUsersList(2, 20);

      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('powinien propagować błąd przy braku uprawnień administratora', async () => {
      const error = new Error('Forbidden - Admin access required');
      vi.mocked(apiClient.request).mockRejectedValue(error);

      await expect(usersService.getUsersList()).rejects.toThrow('Forbidden - Admin access required');
    });
  });

  describe('deactivateAccount', () => {
    it('powinien pomyślnie dezaktywować konto użytkownika', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await usersService.deactivateAccount();

      expect(apiClient.delete).toHaveBeenCalledWith('/users/profile');
    });

    it('powinien propagować błąd przy nieautoryzowanej próbie dezaktywacji', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(usersService.deactivateAccount()).rejects.toThrow('Unauthorized');
    });

    it('powinien propagować błąd gdy konto jest już dezaktywowane', async () => {
      const error = new Error('Account already deactivated');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(usersService.deactivateAccount()).rejects.toThrow('Account already deactivated');
    });
  });
});
