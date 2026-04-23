"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Search, ShieldAlert, ShieldCheck } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn, ensureArray } from "@/lib/utils";
import type { StudentRecord } from "@/lib/types";

export default function StudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<StudentRecord[]>("/students?page=1&limit=500");
      setStudents(ensureArray<StudentRecord>(response.data).filter((student) => (student.role ?? "student") === "student"));
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (user?.role === "admin") {
      void loadStudents();
    }
  }, [loadStudents, user?.role]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredStudents = useMemo(
    () =>
      !normalizedQuery
        ? students
        : students.filter((student) =>
            [student.userId, student.fullName, student.email, student.phone, student.department, student.academicYear].some((value) =>
              String(value ?? "").toLowerCase().includes(normalizedQuery),
            ),
          ),
    [normalizedQuery, students],
  );

  const stats = useMemo(() => {
    const active = students.filter((student) => student.isActive !== false).length;
    const inactive = students.filter((student) => student.isActive === false).length;
    const withPhone = students.filter((student) => student.phone).length;
    const withEmail = students.filter((student) => student.email).length;

    return { active, inactive, withPhone, withEmail };
  }, [students]);

  if (user && user.role !== "admin") {
    return <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang chuyển hướng về bảng điều khiển...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Danh bạ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Sinh viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tìm Sinh viên hoặc tra cứu nhanh thông tin tài khoản.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(students.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Đang hoạt động</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(stats.active)}</p>
            </div>
            <div className="rounded-2xl bg-destructive/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-destructive">Bị khóa</p>
              <p className="mt-1 text-xl font-semibold text-destructive">{formatNumber(stats.inactive)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Có email</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(stats.withEmail)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-3">
          <label className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sinh viên"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">{error}</div> : null}

      <ResourceTable
        loading={loading}
        error={null}
        rows={filteredStudents}
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
            header: "Trạng thái",
            render: (student) => (
              <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", student.isActive === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>
                {student.isActive === false ? <ShieldAlert className="mr-1 h-3.5 w-3.5" /> : <ShieldCheck className="mr-1 h-3.5 w-3.5" />}
                {student.isActive === false ? "Đã khóa" : "Đang hoạt động"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
