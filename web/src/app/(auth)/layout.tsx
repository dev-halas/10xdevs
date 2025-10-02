import type { ReactNode } from "react";
import AuthGuard from "../../components/AuthGuard";
import styles from "./styles.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      <div className={styles.container}>
        <div className={styles.card}>{children}</div>
      </div>
    </AuthGuard>
  );
}


