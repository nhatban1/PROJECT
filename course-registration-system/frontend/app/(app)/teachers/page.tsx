"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Building2 } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { ensureArray } from "@/lib/utils";
import type { TeacherRecord } from "@/lib/types";

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<TeacherRecord[]>("/teachers?page=1&limit=500");
        if (cancelled) {
          return;
        }

        setTeachers(ensureArray<TeacherRecord>(response.data));
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách giảng viên");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeachers();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const departments = new Set(teachers.map((teacher) => teacher.department).filter(Boolean));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Đội ngũ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Giảng viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Xem hồ sơ giảng viên từ API phía sau.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(teachers.length)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Khoa phụ trách</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(departments.size)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Cập nhật</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">Trực tiếp</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={teachers}
        rowKey={(teacher) => teacher._id}
        emptyMessage="Không tìm thấy giảng viên nào."
        columns={[
          {
            header: "Mã GV",
            render: (teacher) => (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                <GraduationCap className="mr-1 h-3.5 w-3.5" />
                {teacher.teacherId}
              </span>
            ),
          },
          {
            header: "Họ tên",
            render: (teacher) => <p className="font-medium text-foreground">{teacher.fullName}</p>,
          },
          {
            header: "Khoa",
            render: (teacher) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.department || "-"}</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}