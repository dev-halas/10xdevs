import { 
  apiClient,
} from '../utils/api-client';
import {
  type LoginData,
  type RegisterData,
  type ResetPasswordData,
  type ResetPasswordConfirmData,
  type VerifyEmailData,
  type RefreshTokenData,
  type User,
  type AuthTokens,
  type LoginResponse
} from '../utils/types';

export const authService = {
  // Logowanie użytkownika
  async login(data: LoginData): Promise<LoginResponse> {
    // Serwer zwraca płaską strukturę: { user, token, refreshToken, refreshTokenId }
    const {user, token, refreshToken, refreshTokenId} = await apiClient.post<{ 
      user: User; 
      token: string;
      refreshToken: string; 
      refreshTokenId: string 
    }>('/auth/login', data);
    
    // Przekształć na oczekiwaną przez frontend strukturę
    return {
      tokens: { token, refreshToken, refreshTokenId },
      user,
    };
  },

  // Rejestracja nowego użytkownika
  async register(data: RegisterData): Promise<User> {
    return apiClient.post<User>('/auth/register', data);
  },

  // Żądanie resetu hasła
  async requestPasswordReset(data: ResetPasswordData): Promise<void> {
    return apiClient.post<void>('/auth/reset-password', data);
  },

  // Potwierdzenie resetu hasła
  async confirmPasswordReset(data: ResetPasswordConfirmData): Promise<void> {
    return apiClient.post<void>('/auth/reset-password/confirm', data);
  },

  // Weryfikacja adresu email
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    return apiClient.post<void>('/auth/verify-email', data);
  },

  // Odświeżanie tokenu dostępu
  async refreshToken(data: RefreshTokenData): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/refresh', data);
  },

  // Wylogowanie użytkownika
  async logout(refreshTokenId: string): Promise<void> {
    return apiClient.post<void>('/auth/logout', { refreshTokenId });
  },
};

export type { 
  AuthTokens,
  User,
  LoginData,
  RegisterData,
  ResetPasswordData,
  ResetPasswordConfirmData,
  VerifyEmailData,
  RefreshTokenData
};
