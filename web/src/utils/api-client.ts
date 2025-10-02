import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { type BaseApiResponse } from './types';

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - automatycznie dodaje token autoryzacyjny
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - obsługuje automatyczne odświeżanie tokenów
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Jeśli token jest już odświeżany, czekaj na jego zakończenie
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers!.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshed = await this.refreshAuthTokens();
            
            if (refreshed) {
              // Zsynchronizuj wszystkie requesty z kolejki
              this.processQueue(null, this.getAccessToken());
              
              // Ponów oryginalny request z nowym tokenem
              originalRequest.headers!.Authorization = `Bearer ${this.getAccessToken()}`;
              return this.axiosInstance(originalRequest);
            } else {
              // Jeśli odświeżanie się nie udało, przekaż błąd do kolejki
              this.processQueue(new Error('Nie udało się odświeżyć tokenu'), null);
              this.handleAuthFailure();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError as Error, null);
            this.handleAuthFailure();
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshAuthTokens(): Promise<boolean> {
    try {
      const refreshTokenId = localStorage.getItem('refreshTokenId');
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');

      if (!refreshTokenId || !refreshToken || !accessToken) {
        return false;
      }

      const response = await axios.post(`${this.axiosInstance.defaults.baseURL}/auth/refresh`, {
        refreshTokenId,
        refreshToken,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        const tokens = response.data.data;
        
        localStorage.setItem('accessToken', tokens.token);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('refreshTokenId', tokens.refreshTokenId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Błąd podczas odświeżania tokenów:', error);
      return false;
    }
  }

  private handleAuthFailure() {
    // Wyczyść tokeny i przekieruj do logowania
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refreshTokenId');
    localStorage.removeItem('user');
    
    // Jeśli jesteśmy w przeglądarce, przekieruj do strony logowania
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  // Podstawowe metody HTTP
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<BaseApiResponse<T>> = await this.axiosInstance.get(url, config);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Nieoczekiwany błąd API');
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<BaseApiResponse<T>> = await this.axiosInstance.post(url, data, config);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Nieoczekiwany błąd API');
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<BaseApiResponse<T>> = await this.axiosInstance.put(url, data, config);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Nieoczekiwany błąd API');
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<BaseApiResponse<T>> = await this.axiosInstance.delete(url, config);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Nieoczekiwany błąd API');
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<BaseApiResponse<T>> = await this.axiosInstance.patch(url, data, config);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Nieoczekiwany błąd API');
    }
  }

  // Metoda do pobierania pełnej odpowiedzi z metadanymi
  async request<T>(config: AxiosRequestConfig): Promise<BaseApiResponse<T>> {
    try {
      const response: AxiosResponse<BaseApiResponse<T>> = await this.axiosInstance(config);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Nieoczekiwany błąd API');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<BaseApiResponse<unknown>>;
        
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
        
        if (axiosError.response?.status) {
          switch (axiosError.response.status) {
            case 400:
              throw new Error('Nieprawidłowe zapytanie');
            case 401:
              throw new Error('Nieautoryzowany dostęp');
            case 403:
              throw new Error('Brak uprawnień');
            case 404:
              throw new Error('Nie znaleziono zasobu');
            case 500:
              throw new Error('Błąd serwera');
            default:
              throw new Error(`Błąd HTTP: ${axiosError.response.status}`);
          }
        }
        
        if (axiosError.request) {
          throw new Error('Brak odpowiedzi z serwera');
        }
      }
      
      throw new Error('Nieoczekiewany błąd podczas komunikacji z API');
    }
  }
}

// Konfiguracja i instancja domyślna
const API_BASE_URL = 'http://localhost:3000/api';

export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;