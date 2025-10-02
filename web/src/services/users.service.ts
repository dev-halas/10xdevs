import { apiClient } from '../utils/api-client';
import {
  type User,
  type UpdateUserProfileData,
  type ChangePasswordData,
} from '../utils/types';

export const usersService = {
  // Pobierz profil użytkownika
  async getUserProfile(): Promise<User> {
    return apiClient.get<User>('/users/profile');
  },

  // Zaktualizuj profil użytkownika
  async updateUserProfile(data: UpdateUserProfileData): Promise<User> {
    return apiClient.put<User>('/users/profile', data);
  },

  // Zmień hasło użytkownika
  async changePassword(data: ChangePasswordData): Promise<void> {
    return apiClient.put<void>('/users/change-password', data);
  },

  // Pobierz listę użytkowników (dla adminów)
  async getUsersList(page: number = 1, limit: number = 10): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const response = await apiClient.request<User[]>({
      method: 'GET',
      url: `/users?page=${page}&limit=${limit}`,
    });

    return {
      users: response.data,
      pagination: response.meta?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: response.data.length,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  },

  // Dezaktywuj konto użytkownika
  async deactivateAccount(): Promise<void> {
    return apiClient.delete<void>('/users/profile');
  },
};
