"use client";

import { useState } from "react";
import styles from "../styles.module.css";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // TODO: wywołanie API wysyłające mail resetujący
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
    } catch (err) {
      setError("Nie udało się wysłać wiadomości");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Reset hasła</h1>
      <p className={styles.subtitle}>Wyślemy link resetujący na e‑mail</p>
      {sent ? (
        <p className={styles.muted}>Jeżeli e‑mail istnieje, wysłaliśmy wiadomość z linkiem.</p>
      ) : (
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
          {error && <p className={styles.muted} role="alert">{error}</p>}
          <button className={styles.btn} disabled={loading}>
            {loading ? "Wysyłanie..." : "Wyślij link"}
          </button>
        </form>
      )}
    </div>
  );
}


