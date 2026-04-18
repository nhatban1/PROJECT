"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Phone } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber, formatStatusLabel } from "@/lib/format";
import { ensureArray } from "@/lib/utils";
import type { StudentRecord } from "@/lib/types";

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<StudentRecord[]>("/users?page=1&limit=500");
        if (cancelled) {
          return;
        }

        const records = ensureArray<StudentRecord>(response.data).filter((student) => (student.role ?? "student") === "student");
        setStudents(records);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách sinh viên");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Danh bạ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Sinh viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Duyệt tài khoản sinh viên từ API người dùng phía sau.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(students.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Đã có tên</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(students.filter((student) => student.fullName).length)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Có email</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(students.filter((student) => student.email).length)}</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">Vai trò</p>
              <p className="mt-1 text-xl font-semibold text-amber-800 dark:text-amber-200">{formatStatusLabel("student")}</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={students}
        rowKey={(student) => student._id}
        emptyMessage="Không tìm thấy sinh viên nào."
        columns={[
          {
            header: "Sinh viên",
            render: (student) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{student.fullName || "Sinh viên chưa có tên"}</p>
                <p className="text-xs text-muted-foreground">{student.userId || student._id}</p>
              </div>
            ),
          },
          {
            header: "Email",
            render: (student) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{student.email}</span>
              </div>
            ),
          },
          {
            header: "Số điện thoại",
            render: (student) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{student.phone || "-"}</span>
              </div>
            ),
          },
          {
            header: "Khoa",
            render: (student) => student.department || "-",
          },
          {
            header: "Niên khóa",
            render: (student) => student.academicYear || "-",
          },
          {
            header: "Vai trò",
            render: () => (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Users className="mr-1 h-3.5 w-3.5" />
                Sinh viên
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}