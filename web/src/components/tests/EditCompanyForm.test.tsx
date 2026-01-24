import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditCompanyForm from '../EditCompanyForm';
import { companiesService } from '../../services/companies.service';
import type { Company } from '../../utils/types';

vi.mock('../../services/companies.service', () => ({
  companiesService: {
    updateCompany: vi.fn(),
  },
}));

describe('EditCompanyForm', () => {
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
  });

  describe('Renderowanie formularza', () => {
    it('powinien renderować formularz z danymi firmy', () => {
      render(<EditCompanyForm company={mockCompany} />);

      expect(screen.getByText('Edytuj firmę')).toBeDefined();
      expect(screen.getByDisplayValue('Test Company')).toBeDefined();
      expect(screen.getByDisplayValue('1234567890')).toBeDefined();
      expect(screen.getByDisplayValue('123456789')).toBeDefined();
    });

    it('powinien pokazać przycisk anuluj gdy przekazano onCancel', () => {
      const onCancel = vi.fn();
      render(<EditCompanyForm company={mockCompany} onCancel={onCancel} />);

      const cancelButtons = screen.getAllByText('Anuluj');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Walidacja formularza', () => {
    it('powinien pokazać błąd gdy nazwa firmy jest pusta', async () => {
      render(<EditCompanyForm company={mockCompany} />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      fireEvent.change(nameInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nazwa firmy jest wymagana')).toBeDefined();
      });
    });

    it('powinien pokazać błąd gdy NIP ma nieprawidłowy format', async () => {
      render(<EditCompanyForm company={mockCompany} />);

      const nipInput = screen.getByLabelText('NIP *');
      fireEvent.change(nipInput, { target: { value: '123' } });

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('NIP musi składać się z 10 cyfr')).toBeDefined();
      });
    });

    it('powinien pokazać błąd gdy REGON ma nieprawidłowy format', async () => {
      render(<EditCompanyForm company={mockCompany} />);

      const regonInput = screen.getByLabelText('REGON *');
      fireEvent.change(regonInput, { target: { value: '123' } });

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('REGON musi składać się z 9 lub 14 cyfr')).toBeDefined();
      });
    });
  });

  describe('Aktualizacja firmy', () => {
    it('powinien pomyślnie zaktualizować firmę', async () => {
      const updatedCompany: Company = {
        ...mockCompany,
        name: 'Updated Company Name',
      };

      vi.mocked(companiesService.updateCompany).mockResolvedValue(updatedCompany);

      const onSuccess = vi.fn();
      render(<EditCompanyForm company={mockCompany} onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      fireEvent.change(nameInput, { target: { value: 'Updated Company Name' } });

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(companiesService.updateCompany).toHaveBeenCalledWith('company-123', {
          name: 'Updated Company Name',
          nip: '1234567890',
          regon: '123456789',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Sukces!')).toBeDefined();
      }, { timeout: 2000 });
    });

    it('powinien normalizować NIP i REGON usuwając spacje i myślniki', async () => {
      const updatedCompany: Company = {
        ...mockCompany,
        nip: '9876543210',
        regon: '987654321',
      };

      vi.mocked(companiesService.updateCompany).mockResolvedValue(updatedCompany);

      render(<EditCompanyForm company={mockCompany} />);

      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nipInput, { target: { value: '987-654-32-10' } });
      fireEvent.change(regonInput, { target: { value: '987 654 321' } });

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(companiesService.updateCompany).toHaveBeenCalledWith('company-123', {
          name: 'Test Company',
          nip: '9876543210',
          regon: '987654321',
        });
      });
    });

    it('powinien pokazać błąd przy nieudanej aktualizacji', async () => {
      const error = new Error('Update failed');
      vi.mocked(companiesService.updateCompany).mockRejectedValue(error);

      render(<EditCompanyForm company={mockCompany} />);

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeDefined();
      });
    });

    it('powinien wywołać onSuccess po pomyślnej aktualizacji', async () => {
      const updatedCompany: Company = {
        ...mockCompany,
        name: 'Updated Name',
      };

      vi.mocked(companiesService.updateCompany).mockResolvedValue(updatedCompany);

      const onSuccess = vi.fn();
      render(<EditCompanyForm company={mockCompany} onSuccess={onSuccess} />);

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(companiesService.updateCompany).toHaveBeenCalled();
      });

      // Czekaj na timeout i wywołanie onSuccess
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Interakcje użytkownika', () => {
    it('powinien wywołać onCancel gdy kliknięto przycisk anuluj', () => {
      const onCancel = vi.fn();
      render(<EditCompanyForm company={mockCompany} onCancel={onCancel} />);

      const cancelButtons = screen.getAllByText('Anuluj');
      fireEvent.click(cancelButtons[0]);

      expect(onCancel).toHaveBeenCalled();
    });

    it('powinien wyczyścić błąd gdy użytkownik zacznie pisać', async () => {
      render(<EditCompanyForm company={mockCompany} />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      fireEvent.change(nameInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nazwa firmy jest wymagana')).toBeDefined();
      });

      fireEvent.change(nameInput, { target: { value: 'N' } });

      await waitFor(() => {
        expect(screen.queryByText('Nazwa firmy jest wymagana')).toBeNull();
      });
    });

    it('powinien dezaktywować przyciski podczas ładowania', async () => {
      vi.mocked(companiesService.updateCompany).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<EditCompanyForm company={mockCompany} onCancel={vi.fn()} />);

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Zapisywanie...')).toBeDefined();
      });

      await waitFor(() => {
        const saveBtn = screen.getByRole('button', { name: /Zapisywanie.../i });
        expect(saveBtn).toHaveProperty('disabled', true);
      });
    });

    it('powinien zaktualizować formularz gdy zmieni się company prop', () => {
      const { rerender } = render(<EditCompanyForm company={mockCompany} />);

      expect(screen.getByDisplayValue('Test Company')).toBeDefined();

      const newCompany: Company = {
        ...mockCompany,
        name: 'New Company Name',
      };

      rerender(<EditCompanyForm company={newCompany} />);

      expect(screen.getByDisplayValue('New Company Name')).toBeDefined();
    });
  });

  describe('Wyświetlanie sukcesu', () => {
    it('powinien pokazać komunikat sukcesu i przycisk powrotu', async () => {
      const updatedCompany: Company = {
        ...mockCompany,
        name: 'Updated',
      };

      vi.mocked(companiesService.updateCompany).mockResolvedValue(updatedCompany);

      const onCancel = vi.fn();
      render(<EditCompanyForm company={mockCompany} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: /Zapisz zmiany/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Sukces!')).toBeDefined();
        expect(screen.getByText('Firma została pomyślnie zaktualizowana.')).toBeDefined();
      }, { timeout: 2000 });

      const backButton = screen.getByText('Powrót do szczegółów');
      fireEvent.click(backButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
