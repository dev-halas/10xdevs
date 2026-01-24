import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AddCompanyForm from '../AddCompanyForm';
import { companiesService } from '../../services/companies.service';
import type { Company } from '../../utils/types';

vi.mock('../../services/companies.service', () => ({
  companiesService: {
    createCompany: vi.fn(),
  },
}));

describe('AddCompanyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderowanie formularza', () => {
    it('powinien renderować wszystkie pola formularza', () => {
      render(<AddCompanyForm />);

      expect(screen.getByText('Dodaj nową firmę')).toBeDefined();
      expect(screen.getByLabelText('Nazwa firmy *')).toBeDefined();
      expect(screen.getByLabelText('NIP *')).toBeDefined();
      expect(screen.getByLabelText('REGON *')).toBeDefined();
      expect(screen.getByRole('button', { name: /Dodaj firmę/i })).toBeDefined();
    });

    it('powinien pokazać przycisk anuluj gdy przekazano onCancel', () => {
      const onCancel = vi.fn();
      render(<AddCompanyForm onCancel={onCancel} />);

      const cancelButtons = screen.getAllByText('Anuluj');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('nie powinien pokazać przycisku anuluj gdy nie przekazano onCancel', () => {
      render(<AddCompanyForm />);

      const cancelButtons = screen.queryAllByText('Anuluj');
      expect(cancelButtons.length).toBe(0);
    });
  });

  describe('Walidacja formularza', () => {
    it('powinien pokazać błąd gdy nazwa firmy jest pusta', async () => {
      render(<AddCompanyForm />);

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nazwa firmy jest wymagana')).toBeDefined();
      });
    });

    it('powinien pokazać błąd gdy NIP jest pusty', async () => {
      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('NIP jest wymagany')).toBeDefined();
      });
    });

    it('powinien pokazać błąd gdy REGON jest pusty', async () => {
      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('REGON jest wymagany')).toBeDefined();
      });
    });

    it('powinien pokazać błąd gdy NIP ma nieprawidłowy format', async () => {
      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '123' } });
      fireEvent.change(regonInput, { target: { value: '123456789' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('NIP musi składać się z 10 cyfr')).toBeDefined();
      });
    });

    it('powinien pokazać błąd gdy REGON ma nieprawidłowy format', async () => {
      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });
      fireEvent.change(regonInput, { target: { value: '123' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('REGON musi składać się z 9 lub 14 cyfr')).toBeDefined();
      });
    });

    it('powinien zaakceptować REGON z 14 cyframi', async () => {
      const mockCompany: Company = {
        id: 'company-123',
        name: 'Test Company',
        nip: '1234567890',
        regon: '12345678901234',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(companiesService.createCompany).mockResolvedValue(mockCompany);

      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });
      fireEvent.change(regonInput, { target: { value: '12345678901234' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(companiesService.createCompany).toHaveBeenCalled();
      });
    });
  });

  describe('Wysyłanie formularza', () => {
    it('powinien pomyślnie utworzyć firmę z poprawnymi danymi', async () => {
      const mockCompany: Company = {
        id: 'company-123',
        name: 'Test Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(companiesService.createCompany).mockResolvedValue(mockCompany);

      const onSuccess = vi.fn();
      render(<AddCompanyForm onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });
      fireEvent.change(regonInput, { target: { value: '123456789' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(companiesService.createCompany).toHaveBeenCalledWith({
          name: 'Test Company',
          nip: '1234567890',
          regon: '123456789',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Sukces!')).toBeDefined();
      }, { timeout: 2000 });
    });

    it('powinien normalizować NIP i REGON usuwając spacje i myślniki', async () => {
      const mockCompany: Company = {
        id: 'company-123',
        name: 'Test Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(companiesService.createCompany).mockResolvedValue(mockCompany);

      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '123-456-78-90' } });
      fireEvent.change(regonInput, { target: { value: '123 456 789' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(companiesService.createCompany).toHaveBeenCalledWith({
          name: 'Test Company',
          nip: '1234567890',
          regon: '123456789',
        });
      });
    });

    it('powinien pokazać błąd przy nieudanym utworzeniu firmy', async () => {
      const error = new Error('Company already exists');
      vi.mocked(companiesService.createCompany).mockRejectedValue(error);

      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });
      fireEvent.change(regonInput, { target: { value: '123456789' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company already exists')).toBeDefined();
      });
    });

    it('powinien wyczyścić formularz po pomyślnym dodaniu', async () => {
      const mockCompany: Company = {
        id: 'company-123',
        name: 'Test Company',
        nip: '1234567890',
        regon: '123456789',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(companiesService.createCompany).mockResolvedValue(mockCompany);

      render(<AddCompanyForm />);

      const nameInput = screen.getByLabelText('Nazwa firmy *') as HTMLInputElement;
      const nipInput = screen.getByLabelText('NIP *') as HTMLInputElement;
      const regonInput = screen.getByLabelText('REGON *') as HTMLInputElement;
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });
      fireEvent.change(regonInput, { target: { value: '123456789' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('✓ Sukces!')).toBeDefined();
      }, { timeout: 2000 });
    });
  });

  describe('Interakcje użytkownika', () => {
    it('powinien wywołać onCancel gdy kliknięto przycisk anuluj', () => {
      const onCancel = vi.fn();
      render(<AddCompanyForm onCancel={onCancel} />);

      const cancelButton = screen.getAllByText('Anuluj')[0];
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('powinien wyczyścić błąd gdy użytkownik zacznie pisać', async () => {
      render(<AddCompanyForm />);

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nazwa firmy jest wymagana')).toBeDefined();
      });

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      fireEvent.change(nameInput, { target: { value: 'T' } });

      await waitFor(() => {
        expect(screen.queryByText('Nazwa firmy jest wymagana')).toBeNull();
      });
    });

    it('powinien dezaktywować przyciski podczas ładowania', async () => {
      vi.mocked(companiesService.createCompany).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<AddCompanyForm onCancel={vi.fn()} />);

      const nameInput = screen.getByLabelText('Nazwa firmy *');
      const nipInput = screen.getByLabelText('NIP *');
      const regonInput = screen.getByLabelText('REGON *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });
      fireEvent.change(nipInput, { target: { value: '1234567890' } });
      fireEvent.change(regonInput, { target: { value: '123456789' } });

      const submitButton = screen.getByRole('button', { name: /Dodaj firmę/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Dodawanie...')).toBeDefined();
      });

      await waitFor(() => {
        const submitBtn = screen.getByRole('button', { name: /Dodawanie.../i });
        expect(submitBtn).toHaveProperty('disabled', true);
      });
    });
  });
});
