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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatNumber(value)}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{description}</p>
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

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được dữ liệu tổng quan");
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
      { name: "Sinh viên", value: stats?.studentCount ?? 0 },
      { name: "Giảng viên", value: stats?.teacherCount ?? 0 },
      { name: "Khóa học", value: stats?.courseCount ?? 0 },
      { name: "Đăng ký", value: stats?.registrationCount ?? 0 },
    ],
    [stats],
  );

  const firstName = user?.fullName?.split(/\s+/).filter(Boolean)[0] ?? "Quản trị viên";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.26),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_28%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Tổng quan hệ thống</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Chào mừng trở lại, {firstName}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Theo dõi sinh viên, giảng viên, khóa học và lượt đăng ký từ một màn hình điều khiển duy nhất.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Xem khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/registration" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
              Mở đăng ký
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sinh viên" value={stats?.studentCount ?? 0} description="Tài khoản sinh viên đã đăng ký" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Giảng viên" value={stats?.teacherCount ?? 0} description="Đội ngũ giảng viên trong hệ thống" icon={<GraduationCap className="h-5 w-5" />} />
        <MetricCard label="Khóa học" value={stats?.courseCount ?? 0} description="Các mục khóa học đang hoạt động" icon={<BookOpen className="h-5 w-5" />} />
        <MetricCard label="Đăng ký" value={stats?.registrationCount ?? 0} description="Lượt ghi danh đã xác nhận hiện tại" icon={<CalendarDays className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Biểu đồ phân bố</h2>
              <p className="text-sm text-muted-foreground">Số liệu trực tiếp từ API tổng quan phía sau</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Dữ liệu trực tiếp</span>
          </div>

          {loading ? (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              Đang tải biểu đồ...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    itemStyle={{ color: "var(--popover-foreground)" }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Thao tác nhanh</h2>
            <p className="text-sm text-muted-foreground">Di chuyển nhanh đến các khu vực vận hành chính</p>
          </div>

          <div className="space-y-3">
            {[
              { href: "/students", label: "Xem tài khoản sinh viên", note: "Duyệt người dùng đã ghi danh và thông tin liên hệ" },
              { href: "/teachers", label: "Quản lý giảng viên", note: "Xem đội ngũ giảng viên và các khoa phụ trách" },
              { href: "/courses", label: "Xem khóa học", note: "Kiểm tra lịch học, sức chứa và trạng thái" },
              { href: "/reports", label: "Mở báo cáo", note: "Xem các bản tổng hợp vận hành" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4 transition hover:border-primary/30 hover:bg-primary/5">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}