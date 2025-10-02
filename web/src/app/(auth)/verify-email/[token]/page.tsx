"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "../../styles.module.css";

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // TODO: wywołanie API weryfikujące e‑mail na podstawie tokenu
        await new Promise((r) => setTimeout(r, 6000));
        if (mounted) setStatus("ok");
      } catch {
        if (mounted) setStatus("error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div>
      <h1 className={styles.title}>Potwierdzenie e‑maila</h1>
      <p className={styles.subtitle}>Token: {token.slice(0, 8)}…</p>
      {loading && <p className={styles.muted}>Trwa potwierdzanie…</p>}
      {!loading && status === "ok" && (
        <p className={styles.muted}>Adres e‑mail został potwierdzony. Możesz się zalogować.</p>
      )}
      {!loading && status === "error" && (
        <p className={styles.muted}>Nie udało się potwierdzić adresu e‑mail.</p>
      )}
    </div>
  );
}


