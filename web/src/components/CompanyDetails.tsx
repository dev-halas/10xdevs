"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { companiesService } from '../services/companies.service';
import { type CompanyDetailsProps, type Company } from '../utils/types';
import styles from '../app/page.module.css';

export default function CompanyDetails({ companyId, onBack }: CompanyDetailsProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const companyData = await companiesService.getCompany(companyId);
      setCompany(companyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas ładowania firmy');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId, loadCompany]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Usuń parametr company z URL
      const url = new URL(window.location.href);
      url.searchParams.delete('company');
      window.history.replaceState({}, '', url.toString());
      // Można też użyć router.push('/dashboard') jeśli używasz Next.js router
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Ładowanie...</h2>
          <p>Pobieranie danych firmy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 style={{ color: '#dc3545' }}>Błąd</h2>
          <p>{error}</p>
          <button 
            onClick={() => loadCompany()}
            className={styles.btn}
            style={{ marginRight: '10px' }}
          >
            Spróbuj ponownie
          </button>
          <button 
            onClick={handleBack}
            className={styles.btn}
            style={{ backgroundColor: '#6c757d' }}
          >
            Powrót do listy
          </button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Firma nie znaleziona</h2>
          <p>Nie znaleziono firmy o podanym identyfikatorze.</p>
          <button 
            onClick={handleBack}
            className={styles.btn}
            style={{ backgroundColor: '#6c757d' }}
          >
            Powrót do listy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>{company.name}</h1>
          <button 
            onClick={handleBack}
            className={styles.btn}
            style={{ backgroundColor: '#6c757d' }}
          >
            ← Powrót do listy
          </button>
        </div>
        
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>Informacje o firmie</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>ID:</strong> <span style={{ fontFamily: 'monospace', backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px' }}>{company.id}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Nazwa firmy:</strong> <span style={{ fontSize: '16px', fontWeight: '500' }}>{company.name}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>NIP:</strong> <span style={{ fontFamily: 'monospace' }}>{company.nip}</span>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>REGON:</strong> <span style={{ fontFamily: 'monospace' }}>{company.regon}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Data utworzenia</h4>
            <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
              {new Date(company.createdAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Data aktualizacji</h4>
            <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
              {new Date(company.updatedAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Dostępne akcje</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className={styles.btn}
              style={{ backgroundColor: '#007bff' }}
              onClick={() => {
                // Tutaj możesz dodać akcję edycji firmy
                alert('Funkcja edycji zostanie dodana wkrótce');
              }}
            >
              Edytuj firmę
            </button>
            
            <button 
              className={styles.btn}
              style={{ backgroundColor: '#28a745' }}
              onClick={() => {
                // Tutaj możesz dodać akcję np. eksportu danych
                alert('Funkcja eksportu zostanie dodana wkrótce');
              }}
            >
              Eksportuj dane
            </button>
            
            <button 
              className={styles.btn}
              style={{ backgroundColor: '#dc3545' }}
              onClick={() => {
                // Tutaj możesz dodać akcję usuwania firmy
                alert('Funkcja usuwania zostanie dodana wkrótce');
              }}
            >
              Usuń firmę
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
