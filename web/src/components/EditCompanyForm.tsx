"use client";

import React, { useState, useEffect } from 'react';
import { companiesService } from '../services/companies.service';
import { type Company, type UpdateCompanyData } from '../utils/types';
import styles from '../app/page.module.css';

interface EditCompanyFormProps {
  company: Company;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditCompanyForm({ company, onSuccess, onCancel }: EditCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company.name,
    nip: company.nip,
    regon: company.regon,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Aktualizuj formularz gdy zmieni się company
    setFormData({
      name: company.name,
      nip: company.nip,
      regon: company.regon,
    });
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nazwa firmy jest wymagana');
      return false;
    }
    if (!formData.nip.trim()) {
      setError('NIP jest wymagany');
      return false;
    }
    if (!formData.regon.trim()) {
      setError('REGON jest wymagany');
      return false;
    }

    const nipRegex = /^\d{10}$/;
    if (!nipRegex.test(formData.nip.replace(/[-\s]/g, ''))) {
      setError('NIP musi składać się z 10 cyfr');
      return false;
    }

    const regonRegex = /^(\d{9}|\d{14})$/;
    if (!regonRegex.test(formData.regon.replace(/[-\s]/g, ''))) {
      setError('REGON musi składać się z 9 lub 14 cyfr');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const normalizedData: UpdateCompanyData = {
        name: formData.name.trim(),
        nip: formData.nip.replace(/[-\s]/g, ''),
        regon: formData.regon.replace(/[-\s]/g, ''),
      };

      await companiesService.updateCompany(company.id, normalizedData);
      
      setSuccess(true);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas aktualizacji firmy');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 style={{ color: '#28a745', marginBottom: '16px' }}>✓ Sukces!</h2>
          <p>Firma została pomyślnie zaktualizowana.</p>
          <button 
            onClick={handleCancel}
            className={styles.btn}
            style={{ marginTop: '20px' }}
          >
            Powrót do szczegółów
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Edytuj firmę</h2>
          {onCancel && (
            <button 
              onClick={handleCancel}
              className={styles.btn}
              style={{ backgroundColor: '#6c757d', padding: '8px 16px', height: 'auto' }}
            >
              ← Anuluj
            </button>
          )}
        </div>

        {error && (
          <div style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="name"
              style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#e0e0e0'
              }}
            >
              Nazwa firmy *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="np. ACME Corporation"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="nip"
              style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#e0e0e0'
              }}
            >
              NIP *
            </label>
            <input
              type="text"
              id="nip"
              name="nip"
              value={formData.nip}
              onChange={handleChange}
              placeholder="np. 1234567890 (10 cyfr)"
              disabled={loading}
              maxLength={13}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '16px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            <small style={{ color: '#888', fontSize: '12px' }}>
              Format: 10 cyfr, opcjonalnie z myślnikami
            </small>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="regon"
              style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#e0e0e0'
              }}
            >
              REGON *
            </label>
            <input
              type="text"
              id="regon"
              name="regon"
              value={formData.regon}
              onChange={handleChange}
              placeholder="np. 123456789 (9 lub 14 cyfr)"
              disabled={loading}
              maxLength={16}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '16px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            <small style={{ color: '#888', fontSize: '12px' }}>
              Format: 9 cyfr (standard) lub 14 cyfr (rozszerzony)
            </small>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={loading}
              className={styles.btn}
              style={{
                flex: 1,
                backgroundColor: loading ? '#888' : '#007bff',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className={styles.btn}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                }}
              >
                Anuluj
              </button>
            )}
          </div>
        </form>

        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '8px',
          fontSize: '13px',
          color: '#aaa'
        }}>
          <strong>Wskazówki:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Wszystkie pola są wymagane</li>
            <li>NIP musi zawierać dokładnie 10 cyfr</li>
            <li>REGON może zawierać 9 lub 14 cyfr</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
