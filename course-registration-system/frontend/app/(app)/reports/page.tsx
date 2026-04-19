"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpenCheck, ShieldCheck } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { cn, ensureArray } from "@/lib/utils";
import { formatCurrency, formatNumber, formatStatusLabel, resolveCourseDisplayStatus } from "@/lib/format";
import type { CourseRecord, DashboardStats, RegistrationRecord } from "@/lib/types";

function courseStatusClass(status: string) {
  if (status === "full") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  if (status === "ongoing") {
    return "bg-sky-500/10 text-sky-700 border-sky-200/60 dark:text-sky-300 dark:border-sky-500/20";
  }

  if (status === "closed" || status === "planned") {
    return "bg-muted text-muted-foreground border-border";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
}

function resolveCourseTitle(value: RegistrationRecord["courseId"] | CourseRecord) {
  if (typeof value === "string") {
    return value;
  }

  return value.name ?? value.courseId ?? "-";
}

function resolveStudentTitle(value: RegistrationRecord["studentId"]) {
  if (typeof value === "string") {
    return value;
  }

  return value.fullName ?? value.email ?? value.userId ?? "-";
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const [statsResponse, courseResponse, registrationResponse] = await Promise.all([
          apiFetch<DashboardStats>("/dashboard"),
          apiFetch<CourseRecord[]>("/courses?page=1&limit=500"),
          apiFetch<RegistrationRecord[]>("/registrations?page=1&limit=500"),
        ]);

        if (cancelled) {
          return;
        }

        setStats(statsResponse.data ?? null);
        setCourses(ensureArray<CourseRecord>(courseResponse.data));
        setRegistrations(ensureArray<RegistrationRecord>(registrationResponse.data));
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được báo cáo");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const statusBreakdown = useMemo(() => {
    return {
      open: courses.filter((course) => resolveCourseDisplayStatus(course) === "open").length,
      full: courses.filter((course) => resolveCourseDisplayStatus(course) === "full").length,
      closed: courses.filter((course) => {
        const displayStatus = resolveCourseDisplayStatus(course);
        return displayStatus === "closed" || displayStatus === "planned";
      }).length,
    };
  }, [courses]);

  const busiestCourses = useMemo(() => {
    return [...courses]
      .sort((left, right) => (right.currentStudents / Math.max(right.maxStudents || 1, 1)) - (left.currentStudents / Math.max(left.maxStudents || 1, 1)))
      .slice(0, 5);
  }, [courses]);

  if (user && user.role !== "admin") {
    return <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang chuyển hướng về bảng điều khiển...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Phân tích</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Báo cáo</h1>
            <p className="mt-2 text-sm text-muted-foreground">Báo cáo tổng hợp từ API tổng quan, khóa học và đăng ký.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sinh viên</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(stats?.studentCount ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Giảng viên</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(stats?.teacherCount ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Khóa học</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(stats?.courseCount ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Đăng ký</p>
              <p className="mt-1 text-xl font-semibold text-amber-800 dark:text-amber-200">{formatNumber(stats?.registrationCount ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Khóa đang mở</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatNumber(statusBreakdown.open)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Khóa đã đầy</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatNumber(statusBreakdown.full)}</p>
            </div>
            <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Khóa đã đóng</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{formatNumber(statusBreakdown.closed)}</p>
            </div>
            <div className="rounded-2xl bg-muted p-3 text-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Khóa học đông nhất</h2>
          <ResourceTable
            loading={loading}
            rows={busiestCourses}
            rowKey={(course) => course._id}
            emptyMessage="Không có dữ liệu khóa học."
            columns={[
              { header: "Khóa học", render: (course) => course.name },
              { header: "Giá", render: (course) => formatCurrency(course.price) },
              {
                header: "Mức sử dụng",
                render: (course) => `${course.currentStudents}/${course.maxStudents}`,
              },
              {
                header: "Trạng thái",
                render: (course) => <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", courseStatusClass(resolveCourseDisplayStatus(course)))}>{formatStatusLabel(resolveCourseDisplayStatus(course))}</span>,
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Đăng ký gần đây</h2>
          <ResourceTable
            loading={loading}
            rows={registrations.slice(0, 5)}
            rowKey={(registration) => registration._id}
            emptyMessage="Không có dữ liệu đăng ký."
            columns={[
              { header: "Sinh viên", render: (registration) => resolveStudentTitle(registration.studentId) },
              { header: "Khóa học", render: (registration) => resolveCourseTitle(registration.courseId) },
              { header: "Trạng thái", render: (registration) => formatStatusLabel(registration.status) },
            ]}
          />
        </div>
      </section>
    </div>
  );
}