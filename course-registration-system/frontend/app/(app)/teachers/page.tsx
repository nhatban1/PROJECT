"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Phone, RotateCcw, Save, ShieldAlert, ShieldCheck, UserCog, GraduationCap } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn, ensureArray } from "@/lib/utils";
import type { StudentRecord, TeacherRecord } from "@/lib/types";

type TeacherAccountRow = TeacherRecord & Partial<Pick<StudentRecord, "email" | "phone" | "userId" | "role" | "isActive">>;

type TeacherFormState = {
  fullName: string;
  department: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
};

const emptyForm: TeacherFormState = {
  fullName: "",
  department: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

export default function TeachersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccountRow | null>(null);
  const [form, setForm] = useState<TeacherFormState>(emptyForm);

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
          role: account?.role,
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
    void loadTeachers();
  }, [loadTeachers]);

  const departments = useMemo(() => {
    return new Set(teachers.map((teacher) => teacher.department).filter(Boolean));
  }, [teachers]);

  const stats = useMemo(() => {
    const active = teachers.filter((teacher) => teacher.isActive !== false).length;
    const inactive = teachers.filter((teacher) => teacher.isActive === false).length;
    const withEmail = teachers.filter((teacher) => teacher.email).length;
    const withPhone = teachers.filter((teacher) => teacher.phone).length;

    return { active, inactive, withEmail, withPhone };
  }, [teachers]);

  function beginEdit(teacher: TeacherAccountRow) {
    setSelectedTeacher(teacher);
    setForm({
      fullName: teacher.fullName ?? "",
      department: teacher.department ?? "",
      email: teacher.email ?? "",
      phone: teacher.phone ?? "",
      password: "",
      isActive: teacher.isActive !== false,
    });
    setStatusMessage("");
  }

  function cancelEdit() {
    setSelectedTeacher(null);
    setForm(emptyForm);
  }

  function resetPasswordToTeacherId() {
    if (!selectedTeacher) {
      return;
    }

    setForm((current) => ({
      ...current,
      password: selectedTeacher.teacherId,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTeacher) {
      return;
    }

    setSaving(true);
    setError("");
    setStatusMessage("");

    try {
      await apiFetch(`/teachers/${selectedTeacher._id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName,
          department: form.department,
          email: form.email,
          phone: form.phone,
          password: form.password || undefined,
          isActive: form.isActive,
        }),
      });

      setStatusMessage(`Đã cập nhật giảng viên ${form.fullName || selectedTeacher.fullName || selectedTeacher.teacherId}`);
      setForm((current) => ({ ...current, password: "" }));
      await loadTeachers();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể cập nhật giảng viên");
    } finally {
      setSaving(false);
    }
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Đội ngũ</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Giảng viên</h1>
            <p className="mt-2 text-sm text-muted-foreground">Xem và chỉnh sửa hồ sơ tài khoản giảng viên từ API phía sau.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(teachers.length)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Khoa</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(departments.size)}</p>
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
      </section>

      {isAdmin ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Chỉnh sửa giảng viên</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{selectedTeacher ? selectedTeacher.fullName : "Chọn một giảng viên"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mật khẩu hiện tại được mã hóa. Hãy nhập mật khẩu mới nếu muốn đổi, hoặc dùng nút đặt lại theo mã giảng viên.
                </p>
              </div>

              {selectedTeacher ? (
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

            {selectedTeacher ? (
              <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Họ tên</span>
                  <input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Họ tên giảng viên"
                  />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Khoa</span>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.department}
                      onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="Khoa phụ trách"
                    />
                  </div>
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      placeholder="giangvien@iuh.edu.vn"
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
                    onClick={resetPasswordToTeacherId}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Đặt mật khẩu theo mã giảng viên
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
                Chọn một giảng viên ở bảng bên dưới để chỉnh sửa thông tin và đặt lại mật khẩu.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Tài khoản giảng viên</p>
                <p className="text-sm text-muted-foreground">Xem thông tin đăng nhập và trạng thái</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email đang chọn</p>
                <p className="mt-1 font-medium text-foreground">{selectedTeacher?.email || "-"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã tài khoản</p>
                <p className="mt-1 font-medium text-foreground">{selectedTeacher?.userId || selectedTeacher?.teacherId || selectedTeacher?._id || "-"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                <p className={cn("mt-1 inline-flex items-center gap-2 font-medium", selectedTeacher?.isActive === false ? "text-destructive" : "text-emerald-700 dark:text-emerald-300")}>
                  {selectedTeacher?.isActive === false ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {selectedTeacher ? (selectedTeacher.isActive === false ? "Đã khóa" : "Đang hoạt động") : "-"}
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
                {teacher.isActive === false ? "Đã khóa" : "Đang hoạt động"}
              </span>
            ),
          },
          {
            header: "Hành động",
            render: (teacher) => (
              <button
                type="button"
                onClick={() => beginEdit(teacher)}
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
