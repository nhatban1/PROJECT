"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? "Dang nhap that bai");
      }

      const token = payload?.data?.token;
      if (!token) {
        throw new Error("Khong tim thay token dang nhap");
      }

      window.localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Co loi xay ra khi dang nhap");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
      <div className="grid md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.24),_transparent_38%),linear-gradient(135deg,_#0f172a_0%,_#1e293b_55%,_#334155_100%)] p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05)_70%,transparent)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
              <GraduationCap className="h-4 w-4" />
              Course Registration System
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300/90">Secure access</p>
              <h1 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
                Manage semesters, courses, and registrations in one place.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-200/90 sm:text-lg">
                Sign in to continue to the academic dashboard and handle student workflows without switching tools.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-200/90 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                Fast login
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                Role-based access
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                Dashboard ready
              </div>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10 lg:p-12">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">Enter your account to continue.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="admin@eduhub.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between text-sm text-slate-500">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <button type="button" className="font-medium text-indigo-600 transition hover:text-indigo-700">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need an account? Contact your administrator.
          </p>
        </section>
      </div>
    </div>
  );
}