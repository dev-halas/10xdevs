"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "../styles.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Użyj nowego API przez AuthContext
      await login({
        identifier: email.trim(),
        password: password,
      });

      // Przekieruj do dashboardu
      router.push("/dashboard");
    } catch (error: unknown) {
      // Obsługa błędów z nowego API
      if (error instanceof Error && error.message) {
        setError(error.message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError("Błąd połączenia z serwerem");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Zaloguj się</h1>
      <p className={styles.subtitle}>Witaj ponownie</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="email">E‑mail</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="password">Hasło</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className={styles.muted} role="alert">{error}</p>}
        <button className={styles.btn} disabled={loading}>
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>
      <p className={styles.muted} style={{ marginTop: 12 }}>
        Nie masz konta? <Link className={styles.link} href="/register">Załóż konto</Link>
      </p>
      <p className={styles.muted} style={{ marginTop: 4 }}>
        Zapomniałeś hasła? <Link className={styles.link} href="/reset">Zresetuj hasło</Link>
      </p>
    </div>
  );
}



