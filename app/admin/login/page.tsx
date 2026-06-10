"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { adminApi, AdminApiError } from "@/lib/adminApiClient";

const NEXT_RE = /^\/admin(\/|$)/;

function safeNext(raw: string | null): string {
  if (raw && NEXT_RE.test(raw)) return raw;
  return "/admin";
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginShell><div style={{ padding: 16 }}>Loading...</div></LoginShell>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi.login(password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <LoginShell>
      <form
        onSubmit={onSubmit}
        style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
      >
        <label
          style={{ display: "flex", flexDirection: "column", gap: 4, fontWeight: "bold" }}
        >
          Password
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              padding: "4px 6px",
              border: "1px solid var(--w95-bg-darker)",
              background: "var(--w95-bg-lightest)",
            }}
          />
        </label>
        {error ? <div className="admin-error">{error}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            className="w95-button"
            disabled={busy || password.length === 0}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </LoginShell>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <div
        className="w95-raised"
        style={{ padding: 2, width: 320, alignSelf: "center" }}
      >
        <div className="admin-titlebar">
          <span>Share-a-Sketch Admin - Sign in</span>
        </div>
        {children}
      </div>
    </div>
  );
}
