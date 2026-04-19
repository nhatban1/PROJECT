"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, GraduationCap, Mail, Phone, Search, ShieldAlert, ShieldCheck } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn, ensureArray } from "@/lib/utils";
import type { StudentRecord, TeacherRecord } from "@/lib/types";

type TeacherAccountRow = TeacherRecord & Partial<Pick<StudentRecord, "email" | "phone" | "userId" | "isActive">>;

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [teacherResponse, userResponse] = await Promise.all([
        apiFetch<TeacherRecord[]>("/teachers?page=1&limit=500"),
        apiFetch<StudentRecord[]>("/users?page=1&limit=500&role=teacher"),
      ]);

      const teacherProfiles = ensureArray<TeacherRecord>(teacherResponse.data);
      const teacherAccounts = ensureArray<StudentRecord>(userResponse.data).filter((account) => (account.role ?? "teacher") === "teacher");
      const accountsById = new Map(teacherAccounts.map((account) => [account._id, account]));

      const merged = teacherProfiles.map((teacher) => {
        const account = accountsById.get(teacher._id);

        return {
          ...teacher,
          email: account?.email,
          phone: account?.phone,
          userId: account?.userId,
          isActive: account?.isActive,
          fullName: account?.fullName || teacher.fullName,
          department: teacher.department || account?.department,
        };
      });

      setTeachers(merged);
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách giảng viên");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (user?.role === "admin") {
      void loadTeachers();
    }
  }, [loadTeachers, user?.role]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredTeachers = useMemo(
    () =>
      !normalizedQuery
        ? teachers
        : teachers.filter((teacher) =>
            [teacher.teacherId, teacher.fullName, teacher.department, teacher.email, teacher.phone].some((value) =>
              String(value ?? "").toLowerCase().includes(normalizedQuery),
            ),
          ),
    [teachers, normalizedQuery],
  );

  const stats = useMemo(() => {
    const active = teachers.filter((teacher) => teacher.isActive !== false).length;
    const inactive = teachers.filter((teacher) => teacher.isActive === false).length;
    const withEmail = teachers.filter((teacher) => teacher.email).length;
    const withPhone = teachers.filter((teacher) => teacher.phone).length;

    return { active, inactive, withEmail, withPhone };
  }, [teachers]);

  if (user && user.role !== "admin") {
    return <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang chuyển hướng về bảng điều khiển...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Đội ngũ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Giảng viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tìm Mã GV hoặc tra cứu nhanh thông tin giảng viên.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(teachers.length)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Khoa</p>
              <p className="mt-1 text-xl font-semibold text-primary">
                {formatNumber(new Set(teachers.map((teacher) => teacher.department).filter(Boolean)).size)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Đang hoạt động</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(stats.active)}</p>
            </div>
            <div className="rounded-2xl bg-destructive/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-destructive">Bị khóa</p>
              <p className="mt-1 text-xl font-semibold text-destructive">{formatNumber(stats.inactive)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-3">
          <label className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm Mã GV"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">{error}</div> : null}

      <ResourceTable
        loading={loading}
        error={null}
        rows={filteredTeachers}
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
            header: "Email",
            render: (teacher) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.email || "-"}</span>
              </div>
            ),
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
          {
            header: "Số điện thoại",
            render: (teacher) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.phone || "-"}</span>
              </div>
            ),
          },
          {
            header: "Trạng thái",
            render: (teacher) => (
              <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", teacher.isActive === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>
                {teacher.isActive === false ? <ShieldAlert className="mr-1 h-3.5 w-3.5" /> : <ShieldCheck className="mr-1 h-3.5 w-3.5" />}
                {teacher.isActive === false ? "Đã khóa" : "Đang hoạt động"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
