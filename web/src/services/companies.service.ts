import { apiClient } from '../utils/api-client';
import {
  type Company,
  type CompaniesListResponse,
  type CreateCompanyData,
  type UpdateCompanyData,
} from '../utils/types';

export const companiesService = {
  // Pobierz listę firm z paginacją
  async getCompanies(page: number = 1, limit: number = 10): Promise<CompaniesListResponse> {
    const response = await apiClient.request<Company[]>({
      method: 'GET',
      url: `/companies?page=${page}&limit=${limit}`,
    });

    return {
      companies: response.data,
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

  // Pobierz konkretną firmę po ID
  async getCompany(id: string): Promise<Company> {
    return apiClient.get<Company>(`/companies/${id}`);
  },

  // Stwórz nową firmę
  async createCompany(data: CreateCompanyData): Promise<Company> {
    return apiClient.post<Company>('/companies', data);
  },

  // Aktualizuj firmę
  async updateCompany(id: string, data: UpdateCompanyData): Promise<Company> {
    return apiClient.put<Company>(`/companies/${id}`, data);
  },

  // Usuń firmę
  async deleteCompany(id: string): Promise<void> {
    return apiClient.delete<void>(`/companies/${id}`);
  },
};

