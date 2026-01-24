import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardController } from '../dashboard.controller';
import { prisma } from '../../utils/db';
import { createResponseBuilder } from '../../utils/core/api-standards';
import { handleError } from '../../utils/error-handler';

vi.mock('../../utils/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('../../utils/core/api-standards');
vi.mock('../../utils/error-handler');

describe('DashboardController', () => {
  let mockRequest: any;
  let mockReply: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      user: { id: 'user-123' },
    };
    
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    
    mockResponse = {
      ok: vi.fn().mockReturnValue({ success: true }),
      notFound: vi.fn().mockReturnValue({ success: false }),
    };
    
    vi.mocked(createResponseBuilder).mockReturnValue(mockResponse);
  });

  describe('getDashboard', () => {
    it('powinien zwrócić dane dashboardu dla użytkownika', async () => {
      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        companies: [
          {
            id: 'company-1',
            name: 'Company 1',
            nip: '1111111111',
            regon: '111111111',
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-10'),
          },
          {
            id: 'company-2',
            name: 'Company 2',
            nip: '2222222222',
            regon: '222222222',
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-14'),
          },
        ],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserData as any);

      await DashboardController.getDashboard(mockRequest, mockReply);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          select: expect.objectContaining({
            id: true,
            email: true,
            phone: true,
            companies: expect.any(Object),
          }),
        })
      );

      const expectedDashboardData = {
        user: {
          id: mockUserData.id,
          email: mockUserData.email,
          phone: mockUserData.phone,
        },
        companies: mockUserData.companies,
        stats: {
          registeredAt: mockUserData.createdAt,
          lastUpdate: mockUserData.updatedAt,
          companiesCount: 2,
        },
      };

      expect(mockResponse.ok).toHaveBeenCalledWith(expectedDashboardData, 'Welcome to dashboard!');
    });

    it('powinien zwrócić 404 gdy użytkownik nie istnieje', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await DashboardController.getDashboard(mockRequest, mockReply);

      expect(mockResponse.notFound).toHaveBeenCalledWith('User not found');
    });

    it('powinien poprawnie liczyć statystyki z pustą listą firm', async () => {
      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+48123456789',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        companies: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserData as any);

      await DashboardController.getDashboard(mockRequest, mockReply);

      const expectedDashboardData = {
        user: {
          id: mockUserData.id,
          email: mockUserData.email,
          phone: mockUserData.phone,
        },
        companies: [],
        stats: {
          registeredAt: mockUserData.createdAt,
          lastUpdate: mockUserData.updatedAt,
          companiesCount: 0,
        },
      };

      expect(mockResponse.ok).toHaveBeenCalledWith(expectedDashboardData, 'Welcome to dashboard!');
    });

    it('powinien obsłużyć błąd podczas pobierania danych dashboardu', async () => {
      const error = new Error('Database error');
      vi.mocked(prisma.user.findUnique).mockRejectedValue(error);

      await DashboardController.getDashboard(mockRequest, mockReply);

      expect(handleError).toHaveBeenCalledWith(error, mockReply);
    });
  });
});
