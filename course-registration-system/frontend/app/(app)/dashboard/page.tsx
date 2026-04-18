"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, GraduationCap, Users, ClipboardList } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { apiFetch, ApiError, clearAuthToken } from "@/lib/api";
import { formatDateTime, formatNumber, formatScheduleText, formatStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminDashboardData, CourseRecord, DashboardData, RegistrationRecord, StudentDashboardData, TeacherDashboardData } from "@/lib/types";
import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description: string;
  icon: React.ReactNode;
};

function MetricCard({ label, value, description, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function resolveCourseLabel(value: RegistrationRecord["courseId"] | CourseRecord | string | null | undefined) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.name ?? value.courseId ?? value._id ?? "-";
}

function resolveCourseKey(value: RegistrationRecord["courseId"] | CourseRecord | string | null | undefined) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id ?? value.courseId ?? "";
}

function resolveSemesterLabel(value: RegistrationRecord["semesterId"] | CourseRecord["semesterId"] | string | null | undefined) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.name ?? value.semesterId ?? value._id ?? "-";
}

function courseStatusClass(status: CourseRecord["status"]) {
  if (status === "full") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  if (status === "closed") {
    return "bg-muted text-muted-foreground border-border";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
}

function registrationStatusClass(status: RegistrationRecord["status"]) {
  if (status === "cancelled") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
}

function isAdminDashboard(data: DashboardData | null): data is AdminDashboardData {
  return data?.role === "admin";
}

function isStudentDashboard(data: DashboardData | null): data is StudentDashboardData {
  return data?.role === "student";
}

function isTeacherDashboard(data: DashboardData | null): data is TeacherDashboardData {
  return data?.role === "teacher";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<DashboardData>("/dashboard");
        if (cancelled) {
          return;
        }

        setDashboardData(response.data ?? null);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được dữ liệu tổng quan");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const role = dashboardData?.role;
  const firstName = user?.fullName?.split(/\s+/).filter(Boolean)[0] ?? "bạn";

  const adminChartData = useMemo(
    () =>
      isAdminDashboard(dashboardData)
        ? [
            { name: "Sinh viên", value: dashboardData.studentCount },
            { name: "Giảng viên", value: dashboardData.teacherCount },
            { name: "Khóa học", value: dashboardData.courseCount },
            { name: "Đăng ký", value: dashboardData.registrationCount },
          ]
        : [],
    [dashboardData],
  );

  if (loading) {
    return <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang tải bảng điều khiển...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.26),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_28%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
              {role === "student" ? "Khu vực sinh viên" : role === "teacher" ? "Khu vực giảng viên" : role === "admin" ? "Tổng quan hệ thống" : "Tổng quan hệ thống"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Chào mừng trở lại, {firstName}</h1>
            <p className="max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              {role === "student"
                ? "Theo dõi số môn đã đăng ký và các môn đang mở trong học kỳ hiện tại."
                : role === "teacher"
                  ? "Theo dõi số lớp bạn phụ trách và số sinh viên đã đăng ký vào từng lớp."
                  : "Theo dõi sinh viên, giảng viên, khóa học và lượt đăng ký từ một màn hình điều khiển duy nhất."}
            </p>
          </div>

          {isAdminDashboard(dashboardData) ? (
            <div className="flex flex-wrap gap-3">
              <Link href="/courses" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Xem khóa học
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/registration" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
                Mở đăng ký
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {isAdminDashboard(dashboardData) ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Sinh viên" value={formatNumber(dashboardData.studentCount)} description="Tài khoản sinh viên đã đăng ký" icon={<Users className="h-5 w-5" />} />
            <MetricCard label="Giảng viên" value={formatNumber(dashboardData.teacherCount)} description="Đội ngũ giảng viên trong hệ thống" icon={<GraduationCap className="h-5 w-5" />} />
            <MetricCard label="Khóa học" value={formatNumber(dashboardData.courseCount)} description="Các mục khóa học đang hoạt động" icon={<BookOpen className="h-5 w-5" />} />
            <MetricCard label="Đăng ký" value={formatNumber(dashboardData.registrationCount)} description="Lượt ghi danh đã xác nhận hiện tại" icon={<CalendarDays className="h-5 w-5" />} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Biểu đồ phân bố</h2>
                  <p className="text-sm text-muted-foreground">Số liệu trực tiếp từ API tổng quan phía sau</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Dữ liệu trực tiếp</span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "var(--accent)" }}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                      itemStyle={{ color: "var(--popover-foreground)" }}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Thao tác nhanh</h2>
                <p className="text-sm text-muted-foreground">Di chuyển nhanh đến các khu vực vận hành chính</p>
              </div>

              <div className="space-y-3">
                {[
                  { href: "/students", label: "Xem tài khoản sinh viên", note: "Duyệt người dùng đã ghi danh và thông tin liên hệ" },
                  { href: "/teachers", label: "Quản lý giảng viên", note: "Xem đội ngũ giảng viên và các khoa phụ trách" },
                  { href: "/courses", label: "Xem khóa học", note: "Kiểm tra lịch học, sức chứa và trạng thái" },
                  { href: "/reports", label: "Mở báo cáo", note: "Xem các bản tổng hợp vận hành" },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4 transition hover:border-primary/30 hover:bg-primary/5">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {isStudentDashboard(dashboardData) ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Môn đã đăng ký" value={formatNumber(dashboardData.registeredCourseCount)} description="Số môn sinh viên đã ghi danh" icon={<ClipboardList className="h-5 w-5" />} />
            <MetricCard label="Môn đang mở" value={formatNumber(dashboardData.openCourseCount)} description="Các môn có thể đăng ký trong học kỳ hiện tại" icon={<BookOpen className="h-5 w-5" />} />
            <MetricCard label="Học kỳ hiện tại" value={dashboardData.activeSemester?.name ?? "-"} description={dashboardData.activeSemester?.semesterId ?? "Chưa có học kỳ mở"} icon={<CalendarDays className="h-5 w-5" />} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <ClipboardList className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-foreground">Các môn đã đăng ký gần đây</h2>
            </div>
            <ResourceTable
              loading={false}
              error={null}
              rows={dashboardData.registrations}
              rowKey={(registration) => registration._id}
              emptyMessage="Bạn chưa đăng ký môn nào."
              columns={[
                {
                  header: "Khóa học",
                  render: (registration) => (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{resolveCourseLabel(registration.courseId)}</p>
                      <p className="text-xs text-muted-foreground">{resolveCourseKey(registration.courseId)}</p>
                    </div>
                  ),
                },
                {
                  header: "Học kỳ",
                  render: (registration) => <span className="text-foreground">{resolveSemesterLabel(registration.semesterId)}</span>,
                },
                {
                  header: "Trạng thái",
                  render: (registration) => (
                    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", registrationStatusClass(registration.status))}>
                      {formatStatusLabel(registration.status)}
                    </span>
                  ),
                },
                {
                  header: "Ngày đăng ký",
                  render: (registration) => formatDateTime(registration.createdAt),
                },
              ]}
            />
          </section>
        </>
      ) : null}

      {isTeacherDashboard(dashboardData) ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Lớp giảng dạy" value={formatNumber(dashboardData.courseCount)} description="Số lớp bạn đang phụ trách" icon={<GraduationCap className="h-5 w-5" />} />
            <MetricCard label="Sinh viên đã đăng ký" value={formatNumber(dashboardData.totalRegisteredStudents)} description="Tổng số lượt ghi danh trong các lớp của bạn" icon={<Users className="h-5 w-5" />} />
            <MetricCard label="Học kỳ hiện tại" value={dashboardData.activeSemester?.name ?? "-"} description={dashboardData.activeSemester?.semesterId ?? "Chưa có học kỳ mở"} icon={<CalendarDays className="h-5 w-5" />} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-foreground">Các lớp bạn phụ trách</h2>
            </div>
            <ResourceTable
              loading={false}
              error={null}
              rows={dashboardData.courses}
              rowKey={(course) => course._id}
              emptyMessage="Bạn chưa được gán lớp nào."
              columns={[
                {
                  header: "Môn học",
                  render: (course) => (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.courseId}</p>
                    </div>
                  ),
                },
                {
                  header: "Học kỳ",
                  render: (course) => <span className="text-foreground">{resolveSemesterLabel(course.semesterId)}</span>,
                },
                {
                  header: "Sĩ số",
                  render: (course) => (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {formatNumber(course.currentStudents)} / {formatNumber(course.maxStudents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {course.currentStudents >= course.maxStudents ? "Đã đầy" : "Còn chỗ"}
                      </p>
                    </div>
                  ),
                },
                {
                  header: "Trạng thái",
                  render: (course) => (
                    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", courseStatusClass(course.status))}>
                      {formatStatusLabel(course.status)}
                    </span>
                  ),
                },
                {
                  header: "Lịch học",
                  render: (course) => <span className="text-foreground">{formatScheduleText((course as CourseRecord).schedule)}</span>,
                },
              ]}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
