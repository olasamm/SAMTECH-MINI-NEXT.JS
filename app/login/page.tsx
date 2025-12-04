"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          identifier: identifier.trim(), 
          password 
        })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        setError("Invalid response from server. Please try again.");
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        console.error("Login failed:", data);
        // Show more specific error message
        if (res.status === 401) {
          setError("Invalid email/handle or password. Please check your credentials and try again.");
        } else {
          setError(data.error ?? "Unable to sign in");
        }
        setLoading(false);
        return;
      }
      
      // Verify cookie was set by checking response headers
      const setCookieHeader = res.headers.get("set-cookie");
      if (!setCookieHeader && !data.user) {
        setError("Failed to set authentication cookie. Please try again.");
        setLoading(false);
        return;
      }
      
      // Wait a moment to ensure cookie is set, then redirect
      await new Promise(resolve => setTimeout(resolve, 300));
      // Use window.location to ensure cookie is set before navigation
      window.location.href = "/";
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-3xl p-6 shadow-soft">
        <h1 className="mb-1 text-lg font-semibold text-slate-50">
          Welcome back
        </h1>
        <p className="mb-4 text-xs text-slate-400">
          Sign in to your account to access your social feed.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1 text-xs">
            <label className="text-slate-300">
              Email or handle
            </label>
            <input
              className="h-9 w-full rounded-full border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="mail or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-slate-300">Password</label>
            <input
              type="password"
              className="h-9 w-full rounded-full border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
          <button
            type="submit"
            className="btn-primary w-full justify-center text-xs py-2"
            disabled={loading || !identifier || !password}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-[11px] text-slate-400">
          New here?{" "}
          <button
            className="text-brand-400 hover:text-brand-300"
            onClick={() => router.push("/register")}
          >
            Create an account
          </button>
        </p>
        {/* <p className="mt-2 text-center text-[11px] text-slate-500">
          Demo accounts: <span className="font-medium">daniel@example.com</span>,
          <span className="font-medium"> julia@example.com</span>,
          <span className="font-medium"> naya@example.com</span> with password{" "}
          <span className="font-mono">ipassword123</span>.
        </p> */}
      </div>
    </div>
  );
}


