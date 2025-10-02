"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { type AuthGuardProps } from '../utils/types';

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        // Jeśli użytkownik jest zalogowany, ale strona nie wymaga autoryzacji (np. login/register)
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Pokaż loading podczas sprawdzania autoryzacji
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Ładowanie...</div>
      </div>
    );
  }

  // Jeśli strona wymaga autoryzacji i użytkownik nie jest zalogowany, nie renderuj nic
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Jeśli strona nie wymaga autoryzacji i użytkownik jest zalogowany, nie renderuj nic
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
