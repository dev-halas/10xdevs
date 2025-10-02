"use client";

import { useAuth } from "../../contexts/AuthContext";
import AuthGuard from "../../components/AuthGuard";
import CompaniesList from "../../components/CompaniesList";
import CompanyDetails from "../../components/CompanyDetails";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import styles from "../page.module.css";

function DashboardContent() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company');

  const handleLogout = async () => {
    await logout();
  };

  const handleBackToList = () => {
    // Usuń parametr company z URL
    const url = new URL(window.location.href);
    url.searchParams.delete('company');
    window.history.replaceState({}, '', url.toString());
  };

  // Jeśli mamy companyId w query params, pokaż szczegóły firmy
  if (companyId) {
    return (
      <Suspense fallback={<div className={styles.container}>Ładowanie...</div>}>
        <CompanyDetails companyId={companyId} onBack={handleBackToList} />
      </Suspense>
    );
  }

  // W przeciwnym razie pokaż listę firm
  return (
    <AuthGuard>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Witaj, {user?.email}!</p>
          
          <div style={{ marginTop: '20px', marginBottom: '30px' }}>
            <h2>Informacje o koncie:</h2>
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Telefon:</strong> {user?.phone}</p>
          </div>

          <button 
            onClick={handleLogout}
            className={styles.btn}
            style={{ 
              marginBottom: '30px', 
              backgroundColor: '#dc3545',
              color: 'white'
            }}
          >
            Wyloguj się
          </button>
        </div>
        
        {/* Lista firm */}
        <CompaniesList />
      </div>
    </AuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Ładowanie...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
