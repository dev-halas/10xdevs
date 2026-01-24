import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompaniesController } from '../companies.controller';
import { prisma } from '../../utils/db';
import { createResponseBuilder } from '../../utils/core/api-standards';
import { handleError } from '../../utils/error-handler';
import { CompanyValidationSchemas, CompanyDataNormalizers, CompanyValidators } from '../../utils/helpers/company-helpers';

vi.mock('../../utils/db', () => ({
  prisma: {
    company: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock('../../utils/core/api-standards');
vi.mock('../../utils/error-handler');
vi.mock('../../utils/helpers/company-helpers', async () => {
  const actual = await vi.importActual('../../utils/helpers/company-helpers');
  return {
    ...actual,
    CompanyValidationSchemas: {
      create: { parse: vi.fn() },
      update: { parse: vi.fn() },
      params: { parse: vi.fn() },
    },
    CompanyDataNormalizers: {
      name: vi.fn((val) => val),
      nip: vi.fn((val) => val),
      regon: vi.fn((val) => val),
    },
    CompanyValidators: {
      validateCompanyData: vi.fn(),
    },
  };
});

describe('CompaniesController', () => {
  let mockRequest: any;
  let mockReply: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      body: {},
      query: {},
      params: {},
      user: { id: 'user-123' },
    };
    
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    
    mockResponse = {
      created: vi.fn().mockReturnValue({ success: true }),
      ok: vi.fn().mockReturnValue({ success: true }),
      notFound: vi.fn().mockReturnValue({ success: false }),
      paginated: vi.fn().mockReturnValue({ success: true }),
    };
    
    vi.mocked(createResponseBuilder).mockReturnValue(mockResponse);
  });

  describe('create', () => {
    it('powinien pomyślnie utworzyć firmę', async () => {
      const mockCompanyData = {
        name: 'Test Company',
        nip: '1234567890',
        regon: '123456789',
      };
      
      const mockCreatedCompany = {
        id: 'company-123',
        ...mockCompanyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = mockCompanyData;
      vi.mocked(CompanyValidationSchemas.create.parse).mockReturnValue(mockCompanyData);
      vi.mocked(prisma.company.create).mockResolvedValue(mockCreatedCompany as any);

      await CompaniesController.create(mockRequest, mockReply);

      expect(CompanyValidationSchemas.create.parse).toHaveBeenCalledWith(mockCompanyData);
      expect(CompanyValidators.validateCompanyData).toHaveBeenCalled();
      expect(prisma.company.create).toHaveBeenCalled();
      expect(mockResponse.created).toHaveBeenCalledWith(mockCreatedCompany, 'Company successfully created');
    });

    it('powinien obsłużyć błąd podczas tworzenia firmy', async () => {
      const error = new Error('Creation failed');
      vi.mocked(CompanyValidationSchemas.create.parse).mockImplementation(() => {
        throw error;
      });

      await CompaniesController.create(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('list', () => {
    it('powinien zwrócić listę firm użytkownika', async () => {
      const mockCompanies = [
        { id: 'company-1', name: 'Company 1', nip: '1111111111', regon: '111111111', createdAt: new Date(), updatedAt: new Date() },
        { id: 'company-2', name: 'Company 2', nip: '2222222222', regon: '222222222', createdAt: new Date(), updatedAt: new Date() },
      ];
      
      mockRequest.query = { page: '1', limit: '10' };
      vi.mocked(prisma.company.findMany).mockResolvedValue(mockCompanies as any);
      vi.mocked(prisma.company.count).mockResolvedValue(2);

      await CompaniesController.list(mockRequest, mockReply);

      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
        })
      );
      expect(prisma.company.count).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
      expect(mockResponse.paginated).toHaveBeenCalled();
    });

    it('powinien obsłużyć błąd podczas pobierania listy firm', async () => {
      const error = new Error('List failed');
      vi.mocked(prisma.company.findMany).mockRejectedValue(error);

      await CompaniesController.list(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('getById', () => {
    it('powinien zwrócić firmę po ID', async () => {
      const mockCompany = {
        id: 'company-123',
        name: 'Test Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: 'company-123' };
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'company-123' });
      vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);

      await CompaniesController.getById(mockRequest, mockReply);

      expect(CompanyValidationSchemas.params.parse).toHaveBeenCalledWith({ id: 'company-123' });
      expect(prisma.company.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-123', userId: 'user-123' },
        })
      );
      expect(mockResponse.ok).toHaveBeenCalledWith(mockCompany, 'Company successfully fetched');
    });

    it('powinien zwrócić 404 gdy firma nie istnieje', async () => {
      mockRequest.params = { id: 'non-existent' };
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'non-existent' });
      vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

      await CompaniesController.getById(mockRequest, mockReply);

      expect(mockResponse.notFound).toHaveBeenCalledWith('Company not found');
    });

    it('powinien obsłużyć błąd podczas pobierania firmy', async () => {
      const error = new Error('Fetch failed');
      vi.mocked(CompanyValidationSchemas.params.parse).mockImplementation(() => {
        throw error;
      });

      await CompaniesController.getById(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('update', () => {
    it('powinien pomyślnie zaktualizować firmę', async () => {
      const updateData = {
        name: 'Updated Company',
      };

      const mockCompany = {
        id: 'company-123',
        name: 'Updated Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: 'company-123' };
      mockRequest.body = updateData;
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'company-123' });
      vi.mocked(CompanyValidationSchemas.update.parse).mockReturnValue(updateData);
      vi.mocked(prisma.company.findFirst).mockResolvedValue({ id: 'company-123' } as any);
      vi.mocked(prisma.company.update).mockResolvedValue(mockCompany as any);

      await CompaniesController.update(mockRequest, mockReply);

      expect(CompanyValidationSchemas.params.parse).toHaveBeenCalledWith({ id: 'company-123' });
      expect(CompanyValidationSchemas.update.parse).toHaveBeenCalledWith(updateData);
      expect(prisma.company.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-123', userId: 'user-123' },
        })
      );
      expect(prisma.company.update).toHaveBeenCalled();
      expect(mockResponse.ok).toHaveBeenCalledWith(mockCompany, 'Company successfully updated');
    });

    it('powinien zwrócić 404 gdy firma nie istnieje', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { name: 'Updated Name' };
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'non-existent' });
      vi.mocked(CompanyValidationSchemas.update.parse).mockReturnValue({ name: 'Updated Name' });
      vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

      await CompaniesController.update(mockRequest, mockReply);

      expect(prisma.company.update).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith('Company not found');
    });

    it('powinien obsłużyć błąd podczas aktualizacji firmy', async () => {
      const error = new Error('Update failed');
      vi.mocked(CompanyValidationSchemas.params.parse).mockImplementation(() => {
        throw error;
      });

      await CompaniesController.update(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });

  describe('delete', () => {
    it('powinien pomyślnie usunąć firmę', async () => {
      const mockCompany = {
        id: 'company-123',
        name: 'Test Company',
      };

      mockRequest.params = { id: 'company-123' };
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'company-123' });
      vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
      vi.mocked(prisma.company.delete).mockResolvedValue(mockCompany as any);

      await CompaniesController.delete(mockRequest, mockReply);

      expect(CompanyValidationSchemas.params.parse).toHaveBeenCalledWith({ id: 'company-123' });
      expect(prisma.company.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-123', userId: 'user-123' },
        })
      );
      expect(prisma.company.delete).toHaveBeenCalledWith({
        where: { id: 'company-123' },
      });
      expect(mockResponse.ok).toHaveBeenCalledWith(
        { id: 'company-123', name: 'Test Company' },
        'Company successfully deleted'
      );
    });

    it('powinien zwrócić 404 gdy firma nie istnieje', async () => {
      mockRequest.params = { id: 'non-existent' };
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'non-existent' });
      vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

      await CompaniesController.delete(mockRequest, mockReply);

      expect(prisma.company.delete).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith('Company not found');
    });

    it('powinien obsłużyć błąd podczas usuwania firmy', async () => {
      const error = new Error('Delete failed');
      vi.mocked(CompanyValidationSchemas.params.parse).mockImplementation(() => {
        throw error;
      });

      await CompaniesController.delete(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });

    it('nie powinien pozwolić użytkownikowi usunąć cudzej firmy', async () => {
      mockRequest.params = { id: 'other-company' };
      vi.mocked(CompanyValidationSchemas.params.parse).mockReturnValue({ id: 'other-company' });
      // Firma nie zostanie znaleziona dla tego użytkownika
      vi.mocked(prisma.company.findFirst).mockResolvedValue(null);

      await CompaniesController.delete(mockRequest, mockReply);

      expect(prisma.company.delete).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith('Company not found');
    });
  });
});
