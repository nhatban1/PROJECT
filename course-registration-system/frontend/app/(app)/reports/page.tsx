"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpenCheck, ShieldCheck } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatNumber, formatStatusLabel } from "@/lib/format";
import type { CourseRecord, DashboardStats, RegistrationRecord } from "@/lib/types";

function courseStatusClass(status: CourseRecord["status"]) {
  if (status === "full") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  if (status === "closed") {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setCourses(courseResponse.data ?? []);
        setRegistrations(registrationResponse.data ?? []);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load reports");
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
      open: courses.filter((course) => course.status === "open").length,
      full: courses.filter((course) => course.status === "full").length,
      closed: courses.filter((course) => course.status === "closed").length,
    };
  }, [courses]);

  const busiestCourses = useMemo(() => {
    return [...courses]
      .sort((left, right) => (right.currentStudents / Math.max(right.maxStudents || 1, 1)) - (left.currentStudents / Math.max(left.maxStudents || 1, 1)))
      .slice(0, 5);
  }, [courses]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Reports</h1>
            <p className="mt-2 text-sm text-slate-500">Operational summary built from the dashboard, course, and registration APIs.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Students</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(stats?.studentCount ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-indigo-700">Teachers</p>
              <p className="mt-1 text-xl font-semibold text-indigo-800">{formatNumber(stats?.teacherCount ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Courses</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{formatNumber(stats?.courseCount ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">Registrations</p>
              <p className="mt-1 text-xl font-semibold text-amber-800">{formatNumber(stats?.registrationCount ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Open courses</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(statusBreakdown.open)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Full courses</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(statusBreakdown.full)}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Closed courses</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(statusBreakdown.closed)}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Busiest courses</h2>
          <ResourceTable
            loading={loading}
            rows={busiestCourses}
            rowKey={(course) => course._id}
            emptyMessage="No course data available."
            columns={[
              { header: "Course", render: (course) => course.name },
              {
                header: "Usage",
                render: (course) => `${course.currentStudents}/${course.maxStudents}`,
              },
              {
                header: "Status",
                render: (course) => <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", courseStatusClass(course.status))}>{formatStatusLabel(course.status)}</span>,
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent registrations</h2>
          <ResourceTable
            loading={loading}
            rows={registrations.slice(0, 5)}
            rowKey={(registration) => registration._id}
            emptyMessage="No registration data available."
            columns={[
              { header: "Student", render: (registration) => resolveStudentTitle(registration.studentId) },
              { header: "Course", render: (registration) => resolveCourseTitle(registration.courseId) },
              { header: "Status", render: (registration) => formatStatusLabel(registration.status) },
            ]}
          />
        </div>
      </section>
    </div>
  );
}