"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardStats } from "@/lib/types";
import { apiFetch, ApiError, clearAuthToken } from "@/lib/api";
import { useAuth } from "@/components/layout/AuthProvider";
import { formatNumber } from "@/lib/format";

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
};

function MetricCard({ label, value, description, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{formatNumber(value)}</p>
        </div>
        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<DashboardStats>("/dashboard");
        if (cancelled) {
          return;
        }

        setStats(response.data ?? null);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const chartData = useMemo(
    () => [
      { name: "Students", value: stats?.studentCount ?? 0 },
      { name: "Teachers", value: stats?.teacherCount ?? 0 },
      { name: "Courses", value: stats?.courseCount ?? 0 },
      { name: "Registrations", value: stats?.registrationCount ?? 0 },
    ],
    [stats],
  );

  const firstName = user?.fullName?.split(/\s+/).filter(Boolean)[0] ?? user?.role ?? "Admin";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.26),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_28%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">System overview</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Track students, teachers, courses, and registrations from a single control surface.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              View courses
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/registration" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
              Open registrations
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Students" value={stats?.studentCount ?? 0} description="Registered student accounts" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Teachers" value={stats?.teacherCount ?? 0} description="Teaching staff in the system" icon={<GraduationCap className="h-5 w-5" />} />
        <MetricCard label="Courses" value={stats?.courseCount ?? 0} description="Active course catalog items" icon={<BookOpen className="h-5 w-5" />} />
        <MetricCard label="Registrations" value={stats?.registrationCount ?? 0} description="Current confirmed enrollments" icon={<CalendarDays className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Distribution snapshot</h2>
              <p className="text-sm text-slate-500">Live counts from the backend dashboard API</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live data</span>
          </div>

          {loading ? (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Loading chart...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.08)" }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
            <p className="text-sm text-slate-500">Jump to the main operational areas</p>
          </div>

          <div className="space-y-3">
            {[
              { href: "/students", label: "Review student accounts", note: "View enrolled users and contact details" },
              { href: "/teachers", label: "Manage teachers", note: "Check teaching staff and departments" },
              { href: "/courses", label: "Inspect courses", note: "See schedule, capacity, and status" },
              { href: "/reports", label: "Open reports", note: "Review operational summaries" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}