"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import styles from "../../styles.module.css";

export default function ResetWithTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Hasła nie są takie same");
      return;
    }
    setLoading(true);
    try {
      // TODO: wywołanie API zmieniające hasło z tokenem
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
    } catch (err) {
      setError("Nie udało się ustawić nowego hasła");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Ustaw nowe hasło</h1>
      <p className={styles.subtitle}>Token: {token.slice(0, 8)}…</p>
      {done ? (
        <p className={styles.muted}>Hasło zostało zmienione. Możesz się zalogować.</p>
      ) : (
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.row}>
            <label className={styles.label} htmlFor="password">Nowe hasło</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label} htmlFor="confirm">Powtórz hasło</label>
            <input
              id="confirm"
              type="password"
              className={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <p className={styles.muted} role="alert">{error}</p>}
          <button className={styles.btn} disabled={loading}>
            {loading ? "Zapisywanie..." : "Zapisz nowe hasło"}
          </button>
        </form>
      )}
    </div>
  );
}


