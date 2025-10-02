"use client";

import { useAuth } from "../../contexts/AuthContext";
import AuthGuard from "../../components/AuthGuard";
import styles from "../page.module.css";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AuthGuard>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Witaj, {user?.email}!</p>
          
          <div style={{ marginTop: '20px' }}>
            <h2>Informacje o koncie:</h2>
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Telefon:</strong> {user?.phone}</p>
          </div>

          <button 
            onClick={handleLogout}
            className={styles.btn}
            style={{ 
              marginTop: '20px', 
              backgroundColor: '#dc3545',
              color: 'white'
            }}
          >
            Wyloguj się
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}
