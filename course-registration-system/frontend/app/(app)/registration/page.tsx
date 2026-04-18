"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Phone,
  RotateCcw,
} from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatDateTime, formatNumber, formatScheduleText, formatStatusLabel } from "@/lib/format";
import { cn, ensureArray } from "@/lib/utils";
import type {
  ApiResponse,
  CourseRecord,
  CourseRosterResponse,
  RegistrationRecord,
  SemesterSummary,
} from "@/lib/types";

function resolveTeacherLabel(value: CourseRecord["teacherId"]): string {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.fullName ?? value.teacherId ?? "-";
}

function resolveSemesterLabel(value: CourseRecord["semesterId"]): string {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.name ?? value.semesterId ?? value._id ?? "-";
}

function resolveSemesterKey(value: CourseRecord["semesterId"] | RegistrationRecord["semesterId"] | SemesterSummary | null | undefined) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id ?? value.semesterId ?? "";
}

function resolveCourseKey(value: CourseRecord | RegistrationRecord["courseId"] | string | undefined | null) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id ?? value.courseId ?? "";
}

function resolveStudentLabel(value: RegistrationRecord["studentId"]): string {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.fullName ?? value.email ?? value.userId ?? value._id ?? "-";
}

function resolveStudentKey(value: RegistrationRecord["studentId"]): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id ?? value.userId ?? "";
}

function registrationStatusClass(status: RegistrationRecord["status"]) {
  if (status === "cancelled") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
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

function isCourseInSemester(course: CourseRecord, semester: SemesterSummary | null) {
  if (!semester) {
    return true;
  }

  const courseSemesterKey = resolveSemesterKey(course.semesterId);
  return courseSemesterKey === semester._id || courseSemesterKey === semester.semesterId;
}

function isTeacherCourse(course: CourseRecord, userId?: string | null) {
  if (!userId) {
    return false;
  }

  const teacher = course.teacherId;
  if (!teacher || typeof teacher === "string") {
    return String(teacher) === String(userId);
  }

  return String(teacher._id ?? teacher.teacherId ?? "") === String(userId);
}

export default function RegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeSemester, setActiveSemester] = useState<SemesterSummary | null>(null);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<RegistrationRecord[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<RegistrationRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedRoster, setSelectedRoster] = useState<CourseRosterResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [busyCourseId, setBusyCourseId] = useState("");
  const [busyRegistrationId, setBusyRegistrationId] = useState("");
  const [rosterError, setRosterError] = useState("");

  const role = user?.role ?? "student";

  const refreshData = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const registrationRequest =
        role === "student"
          ? apiFetch<RegistrationRecord[]>("/registrations/my")
          : role === "admin"
            ? apiFetch<RegistrationRecord[]>("/registrations?page=1&limit=500")
            : Promise.resolve<ApiResponse<RegistrationRecord[]> | null>(null);

      const [semesterResponse, courseResponse, registrationResponse] = await Promise.all([
        apiFetch<SemesterSummary>("/semesters/active"),
        apiFetch<CourseRecord[]>("/courses?page=1&limit=500"),
        registrationRequest,
      ]);

      setActiveSemester(semesterResponse.data ?? null);
      setCourses(ensureArray<CourseRecord>(courseResponse.data));

      if (role === "student") {
        setMyRegistrations(ensureArray<RegistrationRecord>(registrationResponse?.data));
        setAllRegistrations([]);
      } else if (role === "admin") {
        setAllRegistrations(ensureArray<RegistrationRecord>(registrationResponse?.data));
        setMyRegistrations([]);
      } else {
        setMyRegistrations([]);
        setAllRegistrations([]);
      }
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không tải được dữ liệu đăng ký");
    } finally {
      setPageLoading(false);
    }
  }, [role, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void refreshData();
  }, [refreshData, user]);

  const availableStudentCourses = useMemo(
    () => courses.filter((course) => isCourseInSemester(course, activeSemester) && course.status === "open"),
    [activeSemester, courses],
  );

  const courseIdsRegisteredByStudent = useMemo(() => {
    return new Set(
      myRegistrations
        .filter((registration) => registration.status === "registered")
        .map((registration) => resolveCourseKey(registration.courseId)),
    );
  }, [myRegistrations]);

  const teacherVisibleCourses = useMemo(() => {
    if (role === "teacher") {
      return courses.filter((course) => isTeacherCourse(course, user?.id ?? user?.userId));
    }

    if (role === "admin") {
      return courses;
    }

    return [] as CourseRecord[];
  }, [courses, role, user?.id, user?.userId]);

  useEffect(() => {
    if (role !== "teacher" && role !== "admin") {
      setSelectedCourseId("");
      setSelectedRoster(null);
      setRosterError("");
      return;
    }

    if (teacherVisibleCourses.length === 0) {
      setSelectedCourseId("");
      setSelectedRoster(null);
      setRosterError("");
      return;
    }

    if (!teacherVisibleCourses.some((course) => course._id === selectedCourseId)) {
      setSelectedCourseId(teacherVisibleCourses[0]._id);
    }
  }, [role, selectedCourseId, teacherVisibleCourses]);

  useEffect(() => {
    if (role !== "teacher" && role !== "admin") {
      return;
    }

    if (!selectedCourseId) {
      setSelectedRoster(null);
      return;
    }

    let cancelled = false;

    async function loadRoster() {
      setRosterLoading(true);
      setRosterError("");

      try {
        const response = await apiFetch<CourseRosterResponse>(`/registrations/course/${selectedCourseId}`);
        if (cancelled) {
          return;
        }

        setSelectedRoster(response.data ?? null);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setSelectedRoster(null);
        setRosterError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách lớp");
      } finally {
        if (!cancelled) {
          setRosterLoading(false);
        }
      }
    }

    void loadRoster();

    return () => {
      cancelled = true;
    };
  }, [role, router, selectedCourseId]);

  const studentRegisteredCount = myRegistrations.filter((registration) => registration.status === "registered").length;
  const studentCancelledCount = myRegistrations.filter((registration) => registration.status === "cancelled").length;
  const rosterCurrentCount = selectedRoster?.total ?? 0;

  async function handleRegister(course: CourseRecord) {
    if (!activeSemester) {
      setError("Không tìm thấy học kỳ đang mở để đăng ký");
      return;
    }

    setBusyCourseId(course._id);
    setStatusMessage("");
    setError("");

    try {
      await apiFetch("/registrations", {
        method: "POST",
        body: JSON.stringify({
          courseId: course._id,
          semesterId: activeSemester._id,
        }),
      });

      setStatusMessage(`Đã đăng ký ${course.name}`);
      await refreshData();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể đăng ký môn học");
    } finally {
      setBusyCourseId("");
    }
  }

  async function handleCancel(registration: RegistrationRecord) {
    setBusyRegistrationId(registration._id);
    setStatusMessage("");
    setError("");

    try {
      await apiFetch(`/registrations/${registration._id}`, {
        method: "DELETE",
      });

      setStatusMessage("Đã hủy đăng ký thành công");
      await refreshData();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể hủy đăng ký");
    } finally {
      setBusyRegistrationId("");
    }
  }

  const studentSummaryCards = [
    {
      label: "Môn có thể đăng ký",
      value: availableStudentCourses.length,
      color: "bg-muted/50",
    },
    {
      label: "Đã đăng ký",
      value: studentRegisteredCount,
      color: "bg-emerald-500/10",
    },
    {
      label: "Đã hủy",
      value: studentCancelledCount,
      color: "bg-destructive/10",
    },
  ];

  const rosterSummaryCards = [
    {
      label: "Lớp đang xem",
      value: teacherVisibleCourses.length,
      color: "bg-muted/50",
    },
    {
      label: "Sinh viên lớp này",
      value: rosterCurrentCount,
      color: "bg-primary/10",
    },
    {
      label: "Môn học tổng",
      value: courses.length,
      color: "bg-emerald-500/10",
    },
  ];

  const roleTitle =
    role === "student"
      ? "Đăng ký học phần"
      : role === "teacher"
        ? "Xem lớp học"
        : "Quản lý đăng ký";

  const roleDescription =
    role === "student"
      ? "Chọn môn đang mở trong học kỳ hiện tại để đăng ký và theo dõi các môn đã đăng ký."
      : role === "teacher"
        ? "Chọn lớp của bạn để xem số lượng sinh viên và danh sách sinh viên đã đăng ký."
        : "Đăng ký, tra cứu và theo dõi toàn bộ lượt ghi danh trong hệ thống.";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Vận hành</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{roleTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{roleDescription}</p>
          </div>

          {activeSemester ? (
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Học kỳ đang mở</p>
              <p className="mt-1 font-semibold">{activeSemester.name}</p>
              <p className="text-xs text-muted-foreground">{activeSemester.semesterId}</p>
            </div>
          ) : null}
        </div>
      </section>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300">
          {statusMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {role === "student" ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {studentSummaryCards.map((card) => (
              <div key={card.label} className={`rounded-3xl border border-border p-5 shadow-sm ${card.color}`}>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatNumber(card.value)}</p>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-foreground">Môn học có thể đăng ký</h2>
            </div>
            <ResourceTable
              loading={pageLoading}
              error={null}
              rows={availableStudentCourses}
              rowKey={(course) => course._id}
              emptyMessage="Không có môn học nào đang mở trong học kỳ hiện tại."
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
                  header: "Giảng viên",
                  render: (course) => (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{resolveTeacherLabel(course.teacherId)}</p>
                      <p className="text-xs text-muted-foreground">{typeof course.teacherId === "string" ? "-" : course.teacherId.teacherId || "-"}</p>
                    </div>
                  ),
                },
                {
                  header: "Lịch học",
                  render: (course) => <span className="text-foreground">{formatScheduleText(course.schedule)}</span>,
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
                  header: "Hành động",
                  render: (course) => {
                    const alreadyRegistered = courseIdsRegisteredByStudent.has(course._id);
                    const isFull = course.currentStudents >= course.maxStudents;
                    const disabled = alreadyRegistered || isFull || busyCourseId === course._id || !activeSemester;

                    return (
                      <button
                        type="button"
                        onClick={() => void handleRegister(course)}
                        disabled={disabled}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                          disabled
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {busyCourseId === course._id ? (
                          <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {alreadyRegistered ? "Đã đăng ký" : isFull ? "Đã đầy" : "Đăng ký"}
                      </button>
                    );
                  },
                },
              ]}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <ClipboardList className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-foreground">Môn đã đăng ký</h2>
            </div>
            <ResourceTable
              loading={pageLoading}
              error={null}
              rows={myRegistrations}
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
                {
                  header: "Hành động",
                  render: (registration) => {
                    const canCancel = registration.status === "registered";

                    return (
                      <button
                        type="button"
                        onClick={() => void handleCancel(registration)}
                        disabled={!canCancel || busyRegistrationId === registration._id}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                          !canCancel || busyRegistrationId === registration._id
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                        )}
                      >
                        {busyRegistrationId === registration._id ? (
                          <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Hủy đăng ký
                      </button>
                    );
                  },
                },
              ]}
            />
          </section>
        </>
      ) : null}

      {(role === "teacher" || role === "admin") ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {rosterSummaryCards.map((card) => (
              <div key={card.label} className={`rounded-3xl border border-border p-5 shadow-sm ${card.color}`}>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatNumber(card.value)}</p>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <GraduationCap className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-foreground">Xem sinh viên theo lớp</h2>
            </div>

            <ResourceTable
              loading={pageLoading}
              error={null}
              rows={teacherVisibleCourses}
              rowKey={(course) => course._id}
              emptyMessage="Không có lớp nào để hiển thị."
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
                  header: "Hành động",
                  render: (course) => (
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(course._id)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      Xem sinh viên
                    </button>
                  ),
                },
              ]}
            />
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Chi tiết lớp</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Danh sách sinh viên đã đăng ký</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedRoster?.course ? `${selectedRoster.course.name} · ${selectedRoster.course.courseId}` : "Chọn một lớp bên trên để xem chi tiết."}
                </p>
              </div>

              {selectedRoster?.course ? (
                <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng sinh viên</p>
                  <p className="mt-1 font-semibold">{formatNumber(selectedRoster.total)}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(selectedRoster.course.currentStudents)} đã ghi trong khóa học</p>
                </div>
              ) : null}
            </div>

            {rosterError ? (
              <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                {rosterError}
              </div>
            ) : null}

            <div className="mt-5">
              <ResourceTable
                loading={rosterLoading}
                error={null}
                rows={selectedRoster?.registrations ?? []}
                rowKey={(registration) => registration._id}
                emptyMessage="Chưa có sinh viên nào đăng ký lớp này."
                columns={[
                  {
                    header: "Sinh viên",
                    render: (registration) => (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{resolveStudentLabel(registration.studentId)}</p>
                        <p className="text-xs text-muted-foreground">{resolveStudentKey(registration.studentId) || "-"}</p>
                      </div>
                    ),
                  },
                  {
                    header: "Email",
                    render: (registration) => (
                      <span className="text-foreground">
                        {typeof registration.studentId === "string" ? "-" : registration.studentId.email || "-"}
                      </span>
                    ),
                  },
                  {
                    header: "Số điện thoại",
                    render: (registration) => (
                      <div className="inline-flex items-center gap-2 text-foreground">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{typeof registration.studentId === "string" ? "-" : registration.studentId.phone || "-"}</span>
                      </div>
                    ),
                  },
                  {
                    header: "Khoa",
                    render: (registration) => (typeof registration.studentId === "string" ? "-" : registration.studentId.department || "-"),
                  },
                  {
                    header: "Niên khóa",
                    render: (registration) => (typeof registration.studentId === "string" ? "-" : registration.studentId.academicYear || "-"),
                  },
                  {
                    header: "Ngày đăng ký",
                    render: (registration) => formatDateTime(registration.createdAt),
                  },
                ]}
              />
            </div>
          </section>
        </>
      ) : null}

      {role === "admin" ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <ClipboardList className="h-4 w-4" />
            <h2 className="text-lg font-semibold text-foreground">Tất cả đăng ký</h2>
          </div>
          <ResourceTable
            loading={pageLoading}
            error={null}
            rows={allRegistrations}
            rowKey={(registration) => registration._id}
            emptyMessage="Không tìm thấy lượt đăng ký nào."
            columns={[
              {
                header: "Sinh viên",
                render: (registration) => (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{resolveStudentLabel(registration.studentId)}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeof registration.studentId === "string" ? "-" : registration.studentId.email || "-"}
                    </p>
                  </div>
                ),
              },
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
                header: "Ngày tạo",
                render: (registration) => formatDateTime(registration.createdAt),
              },
            ]}
          />
        </section>
      ) : null}
    </div>
  );
}

function resolveCourseLabel(value: RegistrationRecord["courseId"]) {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.name ?? value.courseId ?? value._id ?? "-";
}
