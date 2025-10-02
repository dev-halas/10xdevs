"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

type HealthResponse = {
  status: string;
  uptime: number;
  timestamp: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Przekieruj zalogowanych użytkowników do dashboardu
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
      return;
    }

    const fetchHealthcheck = async () => {
      try {
        const res = await fetch("/api/healthcheck", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as HealthResponse;
        setHealth(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    };
    fetchHealthcheck();
  }, [isLoading, isAuthenticated, router]);

  // Pokaż loading podczas sprawdzania autoryzacji
  if (isLoading) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
        <p>Ładowanie...</p>
      </main>
    );
  }

  // Jeśli użytkownik jest zalogowany, nie renderuj nic (zostanie przekierowany)
  if (isAuthenticated) {
    return null;
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Witaj w aplikacji</h1>
      <p>Zaloguj się lub zarejestruj, aby kontynuować.</p>

      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        <a 
          href="/login" 
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "#0070f3", 
            color: "white", 
            textDecoration: "none", 
            borderRadius: "8px" 
          }}
        >
          Zaloguj się
        </a>
        <a 
          href="/register" 
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "transparent", 
            color: "#0070f3", 
            textDecoration: "none", 
            borderRadius: "8px",
            border: "1px solid #0070f3"
          }}
        >
          Zarejestruj się
        </a>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Status API</h2>
        {error && <p style={{ color: "red" }}>Błąd: {error}</p>}
        {health ? (
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 6 }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p>Ładowanie…</p>
        )}
      </section>
    </main>
  );
}
