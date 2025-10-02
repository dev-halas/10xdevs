// Typy podstawowe dla różnych rodzajów odpowiedzi API
export interface BaseApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

// Typy dla autoryzacji
export interface User {
  id: string;
  email: string;
  phone: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  refreshTokenId: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ResetPasswordConfirmData {
  token: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface RefreshTokenData {
  refreshTokenId: string;
  refreshToken: string;
}

// Typy dla firm
export interface Company {
  id: string;
  name: string;
  nip: string;
  regon: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export interface CompaniesListProps {
  onCompanyClick?: (companyId: string) => void;
}

export interface CompanyDetailsProps {
  companyId: string;
  onBack?: () => void;
}

export interface AuthServiceResponse<T> {
  tokens: AuthTokens;
  user: User;
  data: T;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: LoginData) => Promise<void>;
  register: (registerData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export interface CreateCompanyData {
  name: string;
  nip: string;
  regon: string;
}

export interface UpdateCompanyData {
  name?: string;
  nip?: string;
  regon?: string;
}

export interface CompaniesListResponse {
  companies: Company[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UpdateUserProfileData {
  email?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPin: string;
  newPin: string;
}