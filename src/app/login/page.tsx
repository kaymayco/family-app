"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#fff", fontFamily: "var(--font-space), sans-serif" }}
    >
      <div
        className="w-full max-w-sm p-8"
        style={{ border: "2.5px solid #000", boxShadow: "6px 6px 0px #000" }}
      >
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest"
            style={{ background: "#FF85C1", border: "2px solid #000", letterSpacing: "0.1em" }}
          >
            PRIVATE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-space), sans-serif",
              fontWeight: 700,
              fontSize: "2rem",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "#000",
            }}
          >
            MAYEN<br />FAMILY ✦
          </h1>
          <p className="mt-3 text-sm font-medium" style={{ color: "#666" }}>
            Enter the password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            required
            className="w-full px-4 py-3 text-sm font-medium outline-none"
            style={{
              border: error ? "2.5px solid #FF3B30" : "2.5px solid #000",
              background: error ? "#fff5f5" : "#fff",
              fontFamily: "var(--font-space), sans-serif",
            }}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
          />

          {error && (
            <p
              className="text-xs font-bold"
              style={{ color: "#FF3B30", letterSpacing: "0.05em" }}
            >
              WRONG PASSWORD — TRY AGAIN
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 text-sm font-bold tracking-widest transition-all"
            style={{
              background: loading ? "#ccc" : "#B8F02A",
              border: "2.5px solid #000",
              boxShadow: loading ? "none" : "4px 4px 0px #000",
              color: "#000",
              letterSpacing: "0.08em",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "CHECKING..." : "ENTER →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
