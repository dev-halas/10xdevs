import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyDetails from '../CompanyDetails';
import { companiesService } from '../../services/companies.service';
import type { Company } from '../../utils/types';

vi.mock('../../services/companies.service', () => ({
  companiesService: {
    getCompany: vi.fn(),
    deleteCompany: vi.fn(),
    updateCompany: vi.fn(),
  },
}));

// Mock EditCompanyForm
vi.mock('../EditCompanyForm', () => ({
  default: ({ company, onSuccess, onCancel }: any) => (
    <div data-testid="edit-form">
      <p>Editing: {company.name}</p>
      <button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('CompanyDetails', () => {
  const mockCompany: Company = {
    id: 'company-123',
    name: 'Test Company',
    nip: '1234567890',
    regon: '123456789',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    delete (window as any).location;
    window.location = { 
      href: 'http://localhost:3000/dashboard?company=company-123',
      reload: vi.fn() 
    } as any;
  });

  describe('Ładowanie i wyświetlanie danych', () => {
    it('powinien załadować i wyświetlić dane firmy', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);

      render(<CompanyDetails companyId="company-123" />);

      expect(screen.getByText('Ładowanie...')).toBeDefined();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      expect(companiesService.getCompany).toHaveBeenCalledWith('company-123');
      expect(screen.getByText('1234567890')).toBeDefined();
      expect(screen.getByText('123456789')).toBeDefined();
    });

    it('powinien wyświetlić błąd gdy nie można załadować firmy', async () => {
      const error = new Error('Company not found');
      vi.mocked(companiesService.getCompany).mockRejectedValue(error);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByText('Company not found')).toBeDefined();
      });
    });

    it('powinien ponownie załadować dane po kliknięciu Spróbuj ponownie', async () => {
      const error = new Error('Network error');
      vi.mocked(companiesService.getCompany)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockCompany);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeDefined();
      });

      const retryButton = screen.getByText('Spróbuj ponownie');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      expect(companiesService.getCompany).toHaveBeenCalledTimes(2);
    });
  });

  describe('Nawigacja', () => {
    it('powinien wywołać onBack gdy kliknięto przycisk powrotu', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);

      const onBack = vi.fn();
      render(<CompanyDetails companyId="company-123" onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const backButton = screen.getByText('← Powrót do listy');
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Edycja firmy', () => {
    it('powinien wyświetlić formularz edycji po kliknięciu Edytuj firmę', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const editButton = screen.getByText('Edytuj firmę');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-form')).toBeDefined();
        expect(screen.getByText('Editing: Test Company')).toBeDefined();
      });
    });

    it('powinien wrócić do widoku szczegółów po anulowaniu edycji', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const editButton = screen.getByText('Edytuj firmę');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-form')).toBeDefined();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-form')).toBeNull();
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });
    });

    it('powinien przeładować dane firmy po pomyślnej edycji', async () => {
      const updatedCompany: Company = {
        ...mockCompany,
        name: 'Updated Company',
      };

      vi.mocked(companiesService.getCompany)
        .mockResolvedValueOnce(mockCompany)
        .mockResolvedValueOnce(updatedCompany);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const editButton = screen.getByText('Edytuj firmę');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-form')).toBeDefined();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(companiesService.getCompany).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Usuwanie firmy', () => {
    it('powinien wyświetlić modal potwierdzenia po kliknięciu Usuń firmę', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const deleteButton = screen.getByText('Usuń firmę');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Potwierdź usunięcie')).toBeDefined();
        expect(screen.getByText(/Czy na pewno chcesz usunąć firmę/i)).toBeDefined();
        expect(screen.getByText('Ta operacja jest nieodwracalna!')).toBeDefined();
      });
    });

    it('powinien anulować usuwanie i wrócić do szczegółów', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const deleteButton = screen.getByText('Usuń firmę');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Potwierdź usunięcie')).toBeDefined();
      });

      const cancelButton = screen.getByText('Anuluj');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Potwierdź usunięcie')).toBeNull();
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      expect(companiesService.deleteCompany).not.toHaveBeenCalled();
    });

    it('powinien pomyślnie usunąć firmę i wrócić do listy', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);
      vi.mocked(companiesService.deleteCompany).mockResolvedValue({
        id: 'company-123',
        name: 'Test Company',
      });

      const onBack = vi.fn();
      render(<CompanyDetails companyId="company-123" onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const deleteButton = screen.getByText('Usuń firmę');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Potwierdź usunięcie')).toBeDefined();
      });

      const confirmButton = screen.getByText('Tak, usuń firmę');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(companiesService.deleteCompany).toHaveBeenCalledWith('company-123');
      });

      await waitFor(() => {
        expect(onBack).toHaveBeenCalled();
      });
    });

    it('powinien wyświetlić błąd gdy usuwanie nie powiedzie się', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);
      const error = new Error('Delete failed');
      vi.mocked(companiesService.deleteCompany).mockRejectedValue(error);

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const deleteButton = screen.getByText('Usuń firmę');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Potwierdź usunięcie')).toBeDefined();
      });

      const confirmButton = screen.getByText('Tak, usuń firmę');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeDefined();
      });

      // Modal potwierdzenia powinien zniknąć po błędzie
      expect(screen.queryByText('Potwierdź usunięcie')).toBeNull();
    });

    it('powinien dezaktywować przyciski podczas usuwania', async () => {
      vi.mocked(companiesService.getCompany).mockResolvedValue(mockCompany);
      vi.mocked(companiesService.deleteCompany).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<CompanyDetails companyId="company-123" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Company' })).toBeDefined();
      });

      const deleteButton = screen.getByText('Usuń firmę');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Potwierdź usunięcie')).toBeDefined();
      });

      const confirmButton = screen.getByText('Tak, usuń firmę');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Usuwanie...')).toBeDefined();
      });

      const deleteBtn = screen.getByRole('button', { name: /Usuwanie.../i });
      expect(deleteBtn).toHaveProperty('disabled', true);
    });
  });
});
