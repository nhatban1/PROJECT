"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock3, Layers3 } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { cn, ensureArray } from "@/lib/utils";
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
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  if (status === "closed") {
    return "bg-muted text-muted-foreground border-border";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
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

        setCourses(ensureArray<CourseRecord>(response.data));
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách khóa học");
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
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Danh mục</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Khóa học</h1>
            <p className="mt-2 text-sm text-muted-foreground">Kiểm tra sức chứa, lịch học và trạng thái hiện tại của khóa học từ hệ thống phía sau.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(courses.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Đang mở</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(courseStats.open)}</p>
            </div>
            <div className="rounded-2xl bg-destructive/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-destructive">Đã đầy</p>
              <p className="mt-1 text-xl font-semibold text-destructive">{formatNumber(courseStats.full)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Sức chứa</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(courseStats.totalCapacity)}</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={courses}
        rowKey={(course) => course._id}
        emptyMessage="Không tìm thấy khóa học nào."
        columns={[
          {
            header: "Khóa học",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{course.name}</p>
                <p className="text-xs text-muted-foreground">{course.courseId}</p>
              </div>
            ),
          },
          {
            header: "Giảng viên",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{resolveLabel(course.teacherId)}</p>
                <p className="text-xs text-muted-foreground">{typeof course.teacherId === "string" ? "-" : course.teacherId.teacherId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Học kỳ",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{resolveLabel(course.semesterId)}</p>
                <p className="text-xs text-muted-foreground">{typeof course.semesterId === "string" ? "-" : course.semesterId.semesterId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Lịch học",
            render: (course) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span>{formatScheduleText(course.schedule)}</span>
              </div>
            ),
          },
          {
            header: "Tín chỉ",
            render: (course) => (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                {course.credits}
              </span>
            ),
          },
          {
            header: "Sĩ số",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{formatNumber(course.currentStudents)} / {formatNumber(course.maxStudents)}</p>
                <p className="text-xs text-muted-foreground">{course.currentStudents >= course.maxStudents ? "Đã đầy" : "Còn chỗ"}</p>
              </div>
            ),
          },
          {
            header: "Trạng thái",
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