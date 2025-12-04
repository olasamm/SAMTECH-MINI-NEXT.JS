"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Validate fields
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!handle.trim()) {
      setError("Handle is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Submitting registration...", { name, handle, email, passwordLength: password.length });
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          name: name.trim(), 
          handle: handle.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        })
      });
      
      console.log("Response status:", res.status);
      
      let data;
      try {
        data = await res.json();
        console.log("Response data:", data);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setError("Invalid response from server. Please try again.");
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        console.error("Registration failed:", data);
        setError(data.error ?? "Unable to create account");
        setLoading(false);
        return;
      }
      
      console.log("Registration successful, redirecting...");
      console.log("User data:", data.user);
      
      // Wait a moment to ensure cookie is set, then redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      // Registration successful - redirect to home
      window.location.href = "/";
    } catch (err) {
      console.error("Registration error:", err);
      setError(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-3xl p-6 shadow-soft">
        <h1 className="mb-1 text-lg font-semibold text-slate-50">
          Create your account
        </h1>
        <p className="mb-4 text-xs text-slate-400">
          Join the community, follow creators, and share what you&apos;re
          building.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1 text-xs">
            <label className="text-slate-300">Name</label>
            <input
              className="h-9 w-full rounded-full border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-slate-300">Handle</label>
            <input
              className="h-9 w-full rounded-full border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="@yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-slate-300">Email</label>
            <input
              type="email"
              className="h-9 w-full rounded-full border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-slate-300">Password</label>
            <input
              type="password"
              className="h-9 w-full rounded-full border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
          <button
            type="submit"
            className="btn-primary w-full justify-center text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
          {(!name.trim() || !handle.trim() || !email.trim() || password.length < 6) && !loading && (
            <p className="text-xs text-slate-500 mt-1 text-center">
              Please fill in all fields (password must be at least 6 characters)
            </p>
          )}
        </form>
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Already have an account?{" "}
          <button
            className="text-brand-400 hover:text-brand-300"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}


