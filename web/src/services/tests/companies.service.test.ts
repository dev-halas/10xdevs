import { describe, it, expect, vi, beforeEach } from 'vitest';
import { companiesService } from '../companies.service';
import { apiClient } from '../../utils/api-client';
import type {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
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

describe('CompaniesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCompanies', () => {
    it('powinien pomyślnie pobrać listę firm z paginacją', async () => {
      const mockCompanies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company 1',
          nip: '1234567890',
          regon: '123456789',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'company-2',
          name: 'Test Company 2',
          nip: '0987654321',
          regon: '987654321',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockCompanies,
        meta: {
          timestamp: '2024-01-01T00:00:00.000Z',
          pagination: {
            currentPage: 1,
            totalPages: 5,
            totalItems: 50,
            itemsPerPage: 10,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await companiesService.getCompanies(1, 10);

      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/companies?page=1&limit=10',
      });
      expect(result).toEqual({
        companies: mockCompanies,
        pagination: mockResponse.meta.pagination,
      });
    });

    it('powinien używać domyślnych wartości dla page i limit', async () => {
      const mockCompanies: Company[] = [];
      const mockResponse = {
        success: true,
        data: mockCompanies,
        meta: undefined,
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await companiesService.getCompanies();

      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/companies?page=1&limit=10',
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
      const mockCompanies: Company[] = [
        {
          id: 'company-1',
          name: 'Test Company',
          nip: '1234567890',
          regon: '123456789',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const mockResponse = {
        success: true,
        data: mockCompanies,
        meta: undefined,
      };

      vi.mocked(apiClient.request).mockResolvedValue(mockResponse);

      const result = await companiesService.getCompanies(2, 20);

      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('powinien propagować błąd przy nieudanym pobraniu listy firm', async () => {
      const error = new Error('Network error');
      vi.mocked(apiClient.request).mockRejectedValue(error);

      await expect(companiesService.getCompanies()).rejects.toThrow('Network error');
    });
  });

  describe('getCompany', () => {
    it('powinien pomyślnie pobrać konkretną firmę po ID', async () => {
      const mockCompany: Company = {
        id: 'company-123',
        name: 'Test Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockCompany);

      const result = await companiesService.getCompany('company-123');

      expect(apiClient.get).toHaveBeenCalledWith('/companies/company-123');
      expect(result).toEqual(mockCompany);
    });

    it('powinien propagować błąd przy nieistniejącym ID firmy', async () => {
      const error = new Error('Company not found');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(companiesService.getCompany('nonexistent-id')).rejects.toThrow('Company not found');
    });
  });

  describe('createCompany', () => {
    it('powinien pomyślnie utworzyć nową firmę', async () => {
      const createData: CreateCompanyData = {
        name: 'New Company',
        nip: '1234567890',
        regon: '123456789',
      };

      const mockCompany: Company = {
        id: 'company-456',
        name: 'New Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockCompany);

      const result = await companiesService.createCompany(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/companies/add', createData);
      expect(result).toEqual(mockCompany);
    });

    it('powinien propagować błąd walidacji przy tworzeniu firmy', async () => {
      const createData: CreateCompanyData = {
        name: '',
        nip: 'invalid',
        regon: '',
      };

      const error = new Error('Validation failed');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(companiesService.createCompany(createData)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateCompany', () => {
    it('powinien pomyślnie zaktualizować firmę', async () => {
      const updateData: UpdateCompanyData = {
        name: 'Updated Company Name',
      };

      const mockCompany: Company = {
        id: 'company-123',
        name: 'Updated Company Name',
        nip: '1234567890',
        regon: '123456789',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockCompany);

      const result = await companiesService.updateCompany('company-123', updateData);

      expect(apiClient.post).toHaveBeenCalledWith('/companies/update/company-123', updateData);
      expect(result).toEqual(mockCompany);
    });

    it('powinien propagować błąd przy aktualizacji nieistniejącej firmy', async () => {
      const updateData: UpdateCompanyData = {
        name: 'Updated Name',
      };

      const error = new Error('Company not found');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(companiesService.updateCompany('nonexistent-id', updateData)).rejects.toThrow('Company not found');
    });
  });

  describe('deleteCompany', () => {
    it('powinien pomyślnie usunąć firmę', async () => {
      const mockDeletedCompany = {
        id: 'company-123',
        name: 'Test Company',
      };

      vi.mocked(apiClient.delete).mockResolvedValue(mockDeletedCompany);

      const result = await companiesService.deleteCompany('company-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/companies/delete/company-123');
      expect(result).toEqual(mockDeletedCompany);
    });

    it('powinien propagować błąd przy usuwaniu nieistniejącej firmy', async () => {
      const error = new Error('Company not found');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(companiesService.deleteCompany('nonexistent-id')).rejects.toThrow('Company not found');
    });

    it('powinien propagować błąd przy braku uprawnień do usunięcia firmy', async () => {
      const error = new Error('Forbidden');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(companiesService.deleteCompany('company-123')).rejects.toThrow('Forbidden');
    });
  });
});
