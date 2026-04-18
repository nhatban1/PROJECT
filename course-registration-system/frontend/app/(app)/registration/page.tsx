"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, UserRound } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { cn, ensureArray } from "@/lib/utils";
import { formatDateTime, formatNumber, formatStatusLabel } from "@/lib/format";
import type { RegistrationRecord } from "@/lib/types";

function resolveLabel(value: RegistrationRecord["studentId"] | RegistrationRecord["courseId"] | RegistrationRecord["semesterId"]): string {
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

  if ("courseId" in value && value.courseId) {
    return value.courseId;
  }

  if ("semesterId" in value && typeof value.semesterId === "string" && value.semesterId) {
    return value.semesterId;
  }

  if ("userId" in value && value.userId) {
    return value.userId;
  }

  return "-";
}

function registrationStatusClass(status: RegistrationRecord["status"]) {
  if (status === "cancelled") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
}

export default function RegistrationPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrations() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<RegistrationRecord[]>("/registrations?page=1&limit=500");
        if (cancelled) {
          return;
        }

        setRegistrations(ensureArray<RegistrationRecord>(response.data));
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách đăng ký");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRegistrations();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const stats = useMemo(() => {
    const registered = registrations.filter((registration) => registration.status === "registered").length;
    const cancelled = registrations.filter((registration) => registration.status === "cancelled").length;
    const uniqueStudents = new Set(registrations.map((registration) => resolveLabel(registration.studentId))).size;

    return { registered, cancelled, uniqueStudents };
  }, [registrations]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Vận hành</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Đăng ký học phần</h1>
            <p className="mt-2 text-sm text-muted-foreground">Theo dõi toàn bộ lượt đăng ký học phần do hệ thống phía sau trả về.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(registrations.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Đã đăng ký</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(stats.registered)}</p>
            </div>
            <div className="rounded-2xl bg-destructive/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-destructive">Đã hủy</p>
              <p className="mt-1 text-xl font-semibold text-destructive">{formatNumber(stats.cancelled)}</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={registrations}
        rowKey={(registration) => registration._id}
        emptyMessage="Không tìm thấy lượt đăng ký nào."
        columns={[
          {
            header: "Sinh viên",
            render: (registration) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{resolveLabel(registration.studentId)}</p>
                <p className="text-xs text-muted-foreground">{typeof registration.studentId === "string" ? "-" : registration.studentId.email || "-"}</p>
              </div>
            ),
          },
          {
            header: "Khóa học",
            render: (registration) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{resolveLabel(registration.courseId)}</p>
                <p className="text-xs text-muted-foreground">{typeof registration.courseId === "string" ? "-" : registration.courseId.courseId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Học kỳ",
            render: (registration) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{resolveLabel(registration.semesterId)}</span>
              </div>
            ),
          },
          {
            header: "Trạng thái",
            render: (registration) => (
              <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", registrationStatusClass(registration.status))}>
                <ClipboardList className="mr-1 h-3.5 w-3.5" />
                {formatStatusLabel(registration.status)}
              </span>
            ),
          },
          {
            header: "Ngày tạo",
            render: (registration) => formatDateTime(registration.createdAt),
          },
          {
            header: "Vai trò sinh viên",
            render: (registration) => (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <UserRound className="mr-1 h-3.5 w-3.5" />
                {typeof registration.studentId === "string" ? "Sinh viên" : formatStatusLabel(registration.studentId.role || "student")}
              </span>
            ),
          },
        ]}
      />
      <p className="text-sm text-muted-foreground">Tổng số sinh viên duy nhất trong danh sách: {formatNumber(stats.uniqueStudents)}</p>
    </div>
  );
}