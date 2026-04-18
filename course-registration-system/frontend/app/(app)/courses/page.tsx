"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock3, Layers3, Trash2 } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
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
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [deletingCourseId, setDeletingCourseId] = useState("");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await apiFetch<CourseRecord[]>("/courses?page=1&limit=500");
      setCourses(ensureArray<CourseRecord>(response.data));
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách khóa học");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const courseStats = useMemo(() => {
    const open = courses.filter((course) => course.status === "open").length;
    const full = courses.filter((course) => course.status === "full").length;
    const closed = courses.filter((course) => course.status === "closed").length;
    const totalCapacity = courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0);

    return { open, full, closed, totalCapacity };
  }, [courses]);

  const isAdmin = user?.role === "admin";

  async function handleDelete(course: CourseRecord) {
    if (!window.confirm(`Xóa lớp ${course.name}? Thao tác này sẽ hủy các đăng ký liên quan.`)) {
      return;
    }

    setDeletingCourseId(course._id);
    setError("");
    setStatusMessage("");

    try {
      await apiFetch(`/courses/${course._id}`, {
        method: "DELETE",
      });

      setStatusMessage(`Đã xóa lớp ${course.name}`);
      await loadCourses();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể xóa lớp học");
    } finally {
      setDeletingCourseId("");
    }
  }

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

      {isAdmin ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
          Admin có thể xóa lớp học. Khi xóa, toàn bộ lượt đăng ký của lớp đó sẽ được hủy và lớp sẽ không còn hiển thị trong danh sách.
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300">
          {statusMessage}
        </div>
      ) : null}

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
          ...(isAdmin
            ? [
                {
                  header: "Hành động",
                  render: (course: CourseRecord) => (
                    <button
                      type="button"
                      disabled={deletingCourseId === course._id}
                      onClick={() => void handleDelete(course)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                        deletingCourseId === course._id
                          ? "cursor-not-allowed bg-muted text-muted-foreground"
                          : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingCourseId === course._id ? "Đang xóa..." : "Xóa"}
                    </button>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}