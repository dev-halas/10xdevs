"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../styles.module.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validatePassword(password: string): string[] {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Minimum 8 znaków");
    if (!/[a-z]/.test(password)) errors.push("Mała litera");
    if (!/[A-Z]/.test(password)) errors.push("Wielka litera");
    if (!/[0-9]/.test(password)) errors.push("Cyfra");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("Znak specjalny");
    return errors;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirm) {
      setError("Hasła nie są takie same");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Hasło musi zawierać: ${passwordErrors.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.issues) {
          // Błędy walidacji Zod
          const errors = Object.values(data.issues.fieldErrors).flat();
          setError(errors.join(", "));
        } else {
          setError(data.message || "Nie udało się założyć konta");
        }
        return;
      }

      setSuccess(true);
      // Opcjonalnie: przekieruj do logowania
      // router.push("/login");
    } catch (err) {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Załóż konto</h1>
      <p className={styles.subtitle}>Utwórz nowe konto</p>
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
          <label className={styles.label} htmlFor="phone">Telefon</label>
          <input
            id="phone"
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            placeholder="+48123456789"
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
        {success && (
          <p style={{ color: "green", marginBottom: "12px" }} role="alert">
            Konto zostało utworzone! Możesz się teraz zalogować.
          </p>
        )}
        <button className={styles.btn} disabled={loading || success}>
          {loading ? "Zakładanie..." : "Załóż konto"}
        </button>
      </form>
      <p className={styles.muted} style={{ marginTop: 12 }}>
        Masz już konto? <Link className={styles.link} href="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}


