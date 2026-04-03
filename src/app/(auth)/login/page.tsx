"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/queue");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#F9FAFB" }}
    >
      <div
        className="w-[360px] rounded-xl p-8"
        style={{
          backgroundColor: "#FFFFFF",
          border: "0.5px solid #E5E7EB",
        }}
      >
        <h1
          className="mb-6 text-center text-xl font-semibold"
          style={{
            color: "#111827",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Sign in to Aventus
        </h1>

        {error && (
          <div
            className="mb-4 rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "#FEF2F2",
              color: "#991B1B",
              border: "0.5px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "#F9FAFB",
                border: "0.5px solid #E5E7EB",
                color: "#111827",
                fontFamily: "Inter, sans-serif",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "#6B7280", fontFamily: "Inter, sans-serif" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "#F9FAFB",
                border: "0.5px solid #E5E7EB",
                color: "#111827",
                fontFamily: "Inter, sans-serif",
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "#111827",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
