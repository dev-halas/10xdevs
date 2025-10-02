"use client";

import React, { useState, useEffect } from 'react';
import { companiesService } from '../services/companies.service';
import styles from '../app/page.module.css';
import { type CompaniesListProps, type Company } from '../utils/types';

export default function CompaniesList({ onCompanyClick }: CompaniesListProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

    const loadCompanies = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const { companies, pagination } = await companiesService.getCompanies(page, 10);

      setCompanies(companies);
      setTotalPages(pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas ładowania firm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCompanyClick = (companyId: string) => {
    if (onCompanyClick) {
      onCompanyClick(companyId);
    } else {
      // Domyślnie przekieruj do strony szczegółów firmy
      window.location.href = `/dashboard?company=${companyId}`;
    }
  };

  if (loading) {
    return <div className={styles.container}>Ładowanie firm...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h3 style={{ color: '#dc3545' }}>Błąd</h3>
          <p>{error}</p>
          <button 
            onClick={() => loadCompanies(currentPage)}
            className={styles.btn}
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Lista firm</h2>
        
        {companies.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Nie masz jeszcze żadnych firm. Dodaj pierwszą firmę!
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              {companies.map((company) => (
                <div
                  key={company.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleCompanyClick(company.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                    {company.name}
                  </h3>
                  <p style={{ margin: '4px 0', color: '#666' }}>
                    <strong>NIP:</strong> {company.nip}
                  </p>
                  <p style={{ margin: '4px 0', color: '#666' }}>
                    <strong>REGON:</strong> {company.regon}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#888' }}>
                    Utworzono: {new Date(company.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  onClick={() => loadCompanies(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.btn}
                  style={{
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Poprzednia
                </button>
                
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  Strona {currentPage} z {totalPages}
                </span>
                
                <button
                  onClick={() => loadCompanies(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.btn}
                  style={{
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Następna
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
