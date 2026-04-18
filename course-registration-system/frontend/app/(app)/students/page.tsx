"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Save, ShieldAlert, ShieldCheck, UserCog, RotateCcw } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn, ensureArray } from "@/lib/utils";
import type { StudentRecord } from "@/lib/types";

type StudentFormState = {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  academicYear: string;
  password: string;
  isActive: boolean;
};

const emptyForm: StudentFormState = {
  fullName: "",
  email: "",
  phone: "",
  department: "",
  academicYear: "",
  password: "",
  isActive: true,
};

export default function StudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyForm);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<StudentRecord[]>("/users?page=1&limit=500&role=student");
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
    void loadStudents();
  }, [loadStudents]);

  const stats = useMemo(() => {
    const active = students.filter((student) => student.isActive !== false).length;
    const inactive = students.filter((student) => student.isActive === false).length;
    const withPhone = students.filter((student) => student.phone).length;
    const withEmail = students.filter((student) => student.email).length;

    return { active, inactive, withPhone, withEmail };
  }, [students]);

  function beginEdit(student: StudentRecord) {
    setSelectedStudent(student);
    setForm({
      fullName: student.fullName ?? "",
      email: student.email ?? "",
      phone: student.phone ?? "",
      department: student.department ?? "",
      academicYear: student.academicYear ?? "",
      password: "",
      isActive: student.isActive !== false,
    });
    setStatusMessage("");
  }

  function cancelEdit() {
    setSelectedStudent(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedStudent) {
      return;
    }

    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      await apiFetch(`/users/${selectedStudent._id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          department: form.department,
          academicYear: form.academicYear,
          password: form.password || undefined,
          isActive: form.isActive,
        }),
      });

      setStatusMessage(`Đã cập nhật tài khoản của ${form.fullName || selectedStudent.fullName || selectedStudent.userId || selectedStudent._id}`);
      setForm((current) => ({ ...current, password: "" }));
      await loadStudents();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể cập nhật tài khoản sinh viên");
    } finally {
      setSaving(false);
    }
  }

  function resetPasswordToAccountId() {
    if (!selectedStudent) {
      return;
    }

    setForm((current) => ({
      ...current,
      password: selectedStudent.userId || selectedStudent._id,
    }));
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Danh bạ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Sinh viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Duyệt và chỉnh sửa tài khoản sinh viên từ API người dùng phía sau.</p>
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
      </section>

      {isAdmin ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Chỉnh sửa tài khoản</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{selectedStudent ? selectedStudent.fullName || selectedStudent.userId || selectedStudent._id : "Chọn một sinh viên"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mật khẩu hiện tại được mã hóa và không thể xem trực tiếp. Hãy nhập mật khẩu mới nếu muốn đổi.
                </p>
              </div>

              {selectedStudent ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  <RotateCcw className="h-4 w-4" />
                  Bỏ chọn
                </button>
              ) : null}
            </div>

            {selectedStudent ? (
              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Họ tên</span>
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Họ tên sinh viên"
                  />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="sinhvien@iuh.edu.vn"
                    />
                  </div>
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Số điện thoại</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Số điện thoại"
                    />
                  </div>
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Khoa</span>
                  <input
                    value={form.department}
                    onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Công nghệ thông tin"
                  />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Niên khóa</span>
                  <input
                    value={form.academicYear}
                    onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="2025-2026"
                  />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Mật khẩu mới</span>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Để trống nếu không đổi"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 md:col-span-1">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Tài khoản đang hoạt động</span>
                </label>

                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={resetPasswordToAccountId}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Đặt mật khẩu theo mã tài khoản
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition",
                      saving ? "cursor-not-allowed bg-primary/60" : "bg-primary hover:bg-primary/90",
                    )}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-8 text-sm text-muted-foreground">
                Chọn một sinh viên ở bảng bên dưới để chỉnh sửa thông tin và đặt lại mật khẩu.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tài khoản</p>
                <p className="text-sm text-muted-foreground">Xem thông tin đăng nhập đã được chuẩn hóa</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email đang chọn</p>
                <p className="mt-1 font-medium text-foreground">{selectedStudent?.email || "-"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã tài khoản</p>
                <p className="mt-1 font-medium text-foreground">{selectedStudent?.userId || selectedStudent?._id || "-"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                <p className={cn("mt-1 inline-flex items-center gap-2 font-medium", selectedStudent?.isActive === false ? "text-destructive" : "text-emerald-700 dark:text-emerald-300")}>
                  {selectedStudent?.isActive === false ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {selectedStudent ? (selectedStudent.isActive === false ? "Đã khóa" : "Đang hoạt động") : "-"}
                </p>
              </div>
              {statusMessage ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-300">
                  {statusMessage}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <ResourceTable
        loading={loading}
        error={null}
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
            header: "Trạng thái",
            render: (student) => (
              <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", student.isActive === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>{student.isActive === false ? "Đã khóa" : "Đang hoạt động"}</span>
            ),
          },
          {
            header: "Hành động",
            render: (student) => (
              <button
                type="button"
                onClick={() => beginEdit(student)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <UserCog className="h-4 w-4" />
                Sửa
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
