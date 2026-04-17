"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock3, Layers3 } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatNumber, formatScheduleText, formatStatusLabel } from "@/lib/format";
import type { CourseRecord } from "@/lib/types";

function resolveLabel(value: CourseRecord["teacherId"] | CourseRecord["semesterId"]): string {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  if ("fullName" in value && value.fullName) {
    return value.fullName;
  }

  if ("name" in value && value.name) {
    return value.name;
  }

  if ("teacherId" in value && value.teacherId) {
    return value.teacherId;
  }

  if ("semesterId" in value && typeof value.semesterId === "string" && value.semesterId) {
    return value.semesterId;
  }

  return "-";
}

function statusClass(status: CourseRecord["status"]) {
  if (status === "full") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  if (status === "closed") {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<CourseRecord[]>("/courses?page=1&limit=500");
        if (cancelled) {
          return;
        }

        setCourses(response.data ?? []);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load courses");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const courseStats = useMemo(() => {
    const open = courses.filter((course) => course.status === "open").length;
    const full = courses.filter((course) => course.status === "full").length;
    const closed = courses.filter((course) => course.status === "closed").length;
    const totalCapacity = courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0);

    return { open, full, closed, totalCapacity };
  }, [courses]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Catalog</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Courses</h1>
            <p className="mt-2 text-sm text-slate-500">Inspect course capacity, schedules, and current status from the backend.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(courses.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Open</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{formatNumber(courseStats.open)}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-rose-700">Full</p>
              <p className="mt-1 text-xl font-semibold text-rose-800">{formatNumber(courseStats.full)}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-indigo-700">Capacity</p>
              <p className="mt-1 text-xl font-semibold text-indigo-800">{formatNumber(courseStats.totalCapacity)}</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={courses}
        rowKey={(course) => course._id}
        emptyMessage="No courses found."
        columns={[
          {
            header: "Course",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{course.name}</p>
                <p className="text-xs text-slate-500">{course.courseId}</p>
              </div>
            ),
          },
          {
            header: "Teacher",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{resolveLabel(course.teacherId)}</p>
                <p className="text-xs text-slate-500">{typeof course.teacherId === "string" ? "-" : course.teacherId.teacherId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Semester",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{resolveLabel(course.semesterId)}</p>
                <p className="text-xs text-slate-500">{typeof course.semesterId === "string" ? "-" : course.semesterId.semesterId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Schedule",
            render: (course) => (
              <div className="inline-flex items-center gap-2 text-slate-700">
                <Clock3 className="h-4 w-4 text-slate-400" />
                <span>{formatScheduleText(course.schedule)}</span>
              </div>
            ),
          },
          {
            header: "Credits",
            render: (course) => (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                {course.credits}
              </span>
            ),
          },
          {
            header: "Capacity",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{formatNumber(course.currentStudents)} / {formatNumber(course.maxStudents)}</p>
                <p className="text-xs text-slate-500">{course.currentStudents >= course.maxStudents ? "Filled" : "Available"}</p>
              </div>
            ),
          },
          {
            header: "Status",
            render: (course) => (
              <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", statusClass(course.status))}>
                <Layers3 className="mr-1 h-3.5 w-3.5" />
                {formatStatusLabel(course.status)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}