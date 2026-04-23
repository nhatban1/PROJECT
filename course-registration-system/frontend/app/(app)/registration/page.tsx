"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Download,
  GraduationCap,
  Phone,
  UserPlus,
  RotateCcw,
} from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatCreditBreakdown, formatCurrency, formatDateTime, formatNumber, formatScheduleText, formatStatusLabel, resolveCourseDisplayStatus } from "@/lib/format";
import { cn, ensureArray } from "@/lib/utils";
import pdfMakeBase from "pdfmake/build/pdfmake";
import pdfMakeVfs from "pdfmake/build/vfs_fonts";
import type {
  ApiResponse,
  CourseRecord,
  CourseRosterResponse,
  RegistrationRecord,
  SemesterSummary,
  StudentRecord,
} from "@/lib/types";

const pdfMake = pdfMakeBase as unknown as {
  addVirtualFileSystem: (virtualFileSystem: Record<string, string>) => void;
  addFonts: (fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>) => void;
  createPdf: (definition: unknown) => { download: (fileName: string) => void };
};

pdfMake.addVirtualFileSystem(pdfMakeVfs);
pdfMake.addFonts({
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
});

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

function resolveCoursePrice(course: CourseRecord | null | undefined) {
  if (!course || typeof course.price !== "number") {
    return "-";
  }

  return formatCurrency(course.price);
}

function registrationStatusClass(status: RegistrationRecord["status"]) {
  if (status === "cancelled") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  return "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20";
}

function courseStatusClass(status: string) {
  if (status === "full") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }

  if (status === "ongoing") {
    return "bg-sky-500/10 text-sky-700 border-sky-200/60 dark:text-sky-300 dark:border-sky-500/20";
  }

  if (status === "closed" || status === "planned") {
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

function resolveSemesterId(value: CourseRecord["semesterId"]): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value._id ?? value.semesterId ?? "";
}

export default function RegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeSemester, setActiveSemester] = useState<SemesterSummary | null>(null);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<RegistrationRecord[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<RegistrationRecord[]>([]);
  const [adminStudents, setAdminStudents] = useState<StudentRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAdminStudentId, setSelectedAdminStudentId] = useState("");
  const [selectedAdminCourseId, setSelectedAdminCourseId] = useState("");
  const [selectedRoster, setSelectedRoster] = useState<CourseRosterResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [busyCourseId, setBusyCourseId] = useState("");
  const [busyRegistrationId, setBusyRegistrationId] = useState("");
  const [adminEnrollmentLoading, setAdminEnrollmentLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");

  const role = user?.role ?? "student";

  const refreshData = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const studentRequest =
        role === "admin"
          ? apiFetch<StudentRecord[]>("/students?page=1&limit=500")
          : Promise.resolve<ApiResponse<StudentRecord[]> | null>(null);

      const registrationRequest =
        role === "student"
          ? apiFetch<RegistrationRecord[]>("/registrations/my")
          : role === "admin"
            ? apiFetch<RegistrationRecord[]>("/registrations?page=1&limit=500")
            : Promise.resolve<ApiResponse<RegistrationRecord[]> | null>(null);

      const [semesterResponse, courseResponse, registrationResponse, studentResponse] = await Promise.all([
        apiFetch<SemesterSummary>("/semesters/active"),
        apiFetch<CourseRecord[]>("/courses?page=1&limit=500"),
        registrationRequest,
        studentRequest,
      ]);

      setActiveSemester(semesterResponse.data ?? null);
      setCourses(ensureArray<CourseRecord>(courseResponse.data));

      if (role === "student") {
        setMyRegistrations(ensureArray<RegistrationRecord>(registrationResponse?.data));
        setAllRegistrations([]);
        setAdminStudents([]);
      } else if (role === "admin") {
        setAllRegistrations(ensureArray<RegistrationRecord>(registrationResponse?.data));
        setMyRegistrations([]);
        setAdminStudents(ensureArray<StudentRecord>(studentResponse?.data));
      } else {
        setMyRegistrations([]);
        setAllRegistrations([]);
        setAdminStudents([]);
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

  useEffect(() => {
    if (role !== "admin") {
      setSelectedAdminStudentId("");
      setSelectedAdminCourseId("");
      return;
    }

    if (adminStudents.length > 0 && !adminStudents.some((student) => student._id === selectedAdminStudentId)) {
      setSelectedAdminStudentId(adminStudents[0]._id);
    }
  }, [adminStudents, role, selectedAdminStudentId]);

  useEffect(() => {
    if (role !== "admin") {
      return;
    }

    if (courses.length > 0 && !courses.some((course) => course._id === selectedAdminCourseId)) {
      setSelectedAdminCourseId(courses[0]._id);
    }
  }, [courses, role, selectedAdminCourseId]);

  const availableStudentCourses = useMemo(
    () =>
      courses.filter((course) => {
        const displayStatus = resolveCourseDisplayStatus(course);
        return displayStatus === "open";
      }),
    [courses],
  );

  const studentRegistrationClosed = role === "student" && availableStudentCourses.length === 0;

  const courseIdsRegisteredByStudent = useMemo(() => {
    return new Set(
      myRegistrations
        .filter((registration) => registration.status === "registered")
        .map((registration) => resolveCourseKey(registration.courseId)),
    );
  }, [myRegistrations]);

  const teacherVisibleCourses = useMemo(() => {
    if (role === "teacher") {
      return courses.filter((course) => isTeacherCourse(course, user?.id ?? user?.userId) && isCourseInSemester(course, activeSemester));
    }

    if (role === "admin") {
      return courses;
    }

    return [] as CourseRecord[];
  }, [activeSemester, courses, role, user?.id, user?.userId]);

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
  }, [allRegistrations, courses, role, router, selectedCourseId]);

  const studentRegisteredCount = myRegistrations.filter((registration) => registration.status === "registered").length;
  const studentCancelledCount = myRegistrations.filter((registration) => registration.status === "cancelled").length;
  const rosterCurrentCount = selectedRoster?.total ?? 0;

  async function handleRegister(course: CourseRecord) {
    const semesterId = resolveSemesterId(course.semesterId);

    if (!semesterId) {
      setError("Không tìm thấy học kỳ của môn học này");
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
          semesterId,
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

  async function handleAdminEnroll() {
    if (!selectedAdminStudentId || !selectedAdminCourseId) {
      setError("Chọn sinh viên và lớp học trước khi chèn vào lớp");
      return;
    }

    setAdminEnrollmentLoading(true);
    setStatusMessage("");
    setError("");

    try {
      await apiFetch("/registrations/admin-enroll", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedAdminStudentId,
          courseId: selectedAdminCourseId,
        }),
      });

      const targetCourse = courses.find((course) => course._id === selectedAdminCourseId);
      setStatusMessage(`Đã thêm sinh viên vào ${targetCourse?.name ?? "lớp học"}`);
      await refreshData();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể chèn sinh viên vào lớp");
    } finally {
      setAdminEnrollmentLoading(false);
    }
  }

  async function handleAdminOpenCourse(course: CourseRecord) {
    setBusyCourseId(course._id);
    setStatusMessage("");
    setError("");

    try {
      await apiFetch(`/courses/${course._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "open" }),
      });

      setStatusMessage(`Đã mở lớp ${course.name}`);
      await refreshData();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể mở lớp học");
    } finally {
      setBusyCourseId("");
    }
  }

  async function handleAdminCloseCourse(course: CourseRecord) {
    setBusyCourseId(course._id);
    setStatusMessage("");
    setError("");

    try {
      await apiFetch(`/courses/${course._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "closed" }),
      });

      setStatusMessage(`Đã khóa lớp ${course.name}`);
      await refreshData();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể khóa lớp học");
    } finally {
      setBusyCourseId("");
    }
  }

  async function handleAdminRemove(registration: RegistrationRecord) {
    const confirmed = window.confirm(`Xóa sinh viên khỏi lớp ${resolveCourseLabel(registration.courseId)}?`);
    if (!confirmed) {
      return;
    }

    setBusyRegistrationId(registration._id);
    setStatusMessage("");
    setError("");

    try {
      await apiFetch(`/registrations/admin/${registration._id}`, {
        method: "DELETE",
      });

      setStatusMessage("Đã xóa sinh viên khỏi lớp học");
      await refreshData();
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể xóa sinh viên khỏi lớp");
    } finally {
      setBusyRegistrationId("");
    }
  }

  async function handleExportPdf() {
    if (role !== "student") {
      return;
    }

    setPdfLoading(true);

    try {
      const studentName = user?.fullName ?? "Sinh viên";
      const studentCode = user?.userId ?? user?.id ?? "SV";
      const registeredRows = myRegistrations
        .filter((registration) => registration.status === "registered")
        .map((registration) => {
          const course = typeof registration.courseId === "string" ? null : registration.courseId;

          return [
            resolveCourseLabel(registration.courseId),
            course?.courseId ?? "-",
            formatCreditBreakdown(course ?? undefined),
            resolveCoursePrice(course),
            resolveSemesterLabel(registration.semesterId),
          ];
        });

      const totalTuition = myRegistrations
        .filter((registration) => registration.status === "registered")
        .reduce((sum, registration) => {
          const course = typeof registration.courseId === "string" ? null : registration.courseId;
          return sum + (course?.price ?? 0);
        }, 0);

      const openCourseRows = availableStudentCourses.map((course) => [
        course.name,
        course.courseId,
        formatCreditBreakdown(course),
        formatCurrency(course.price),
        `${formatNumber(course.currentStudents)} / ${formatNumber(course.maxStudents)}`,
        formatStatusLabel(resolveCourseDisplayStatus(course)),
      ]);

      const docDefinition = {
        pageSize: "A4",
        pageOrientation: "landscape",
        pageMargins: [24, 28, 24, 24],
        defaultStyle: {
          font: "Roboto",
          fontSize: 10,
          lineHeight: 1.25,
        },
        content: [
          { text: "Danh sách môn đã đăng ký", style: "title" },
          {
            columns: [
              [
                { text: `Sinh viên: ${studentName}` },
                { text: `Mã sinh viên: ${studentCode}` },
                { text: `Ngày xuất: ${formatDateTime(new Date())}` },
              ],
            ],
            margin: [0, 6, 0, 12],
          },
          {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "auto", "auto", "*"],
              body: [
                [
                  { text: "Tên môn", style: "tableHeader" },
                  { text: "Mã môn", style: "tableHeader" },
                  { text: "Tín chỉ", style: "tableHeader" },
                  { text: "Giá", style: "tableHeader" },
                  { text: "Học kỳ", style: "tableHeader" },
                ],
                ...(registeredRows.length > 0
                  ? registeredRows
                  : [["Chưa có môn đã đăng ký", "-", "-", "-", "-"]]),
              ],
            },
            layout: {
              fillColor: (rowIndex: number) => (rowIndex === 0 ? "#0f172a" : rowIndex % 2 === 0 ? "#f8fafc" : null),
              hLineColor: () => "#e2e8f0",
              vLineColor: () => "#e2e8f0",
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 5,
              paddingBottom: () => 5,
            },
            margin: [0, 0, 0, 12],
          },
          { text: `Tổng học phí tạm tính: ${formatCurrency(totalTuition)}`, style: "summary" },
          { text: "Danh sách môn học trong học kỳ", style: "sectionTitle", pageBreak: "before" },
          {
            text: `Học kỳ: ${activeSemester?.name ?? "-"}`,
            margin: [0, 6, 0, 10],
          },
          {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  { text: "Tên môn", style: "tableHeader" },
                  { text: "Mã môn", style: "tableHeader" },
                  { text: "Tín chỉ", style: "tableHeader" },
                  { text: "Giá", style: "tableHeader" },
                  { text: "Sĩ số", style: "tableHeader" },
                  { text: "Trạng thái", style: "tableHeader" },
                ],
                ...(openCourseRows.length > 0
                  ? openCourseRows
                  : [["Không có môn học trong học kỳ hiện tại", "-", "-", "-", "-", "-"]]),
              ],
            },
            layout: {
              fillColor: (rowIndex: number) => (rowIndex === 0 ? "#14532d" : rowIndex % 2 === 0 ? "#f0fdf4" : null),
              hLineColor: () => "#d1fae5",
              vLineColor: () => "#d1fae5",
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 5,
              paddingBottom: () => 5,
            },
          },
        ],
        styles: {
          title: {
            fontSize: 18,
            bold: true,
            color: "#0f172a",
            letterSpacing: 0.2,
          },
          sectionTitle: {
            fontSize: 16,
            bold: true,
            color: "#0f172a",
          },
          summary: {
            fontSize: 11,
            bold: true,
            margin: [0, 2, 0, 0],
            color: "#0f172a",
          },
          tableHeader: {
            bold: true,
            color: "#ffffff",
            fillColor: "#0f172a",
          },
        },
        footer: (currentPage: number, pageCount: number) => ({
          text: `${currentPage} / ${pageCount}`,
          alignment: "right",
          margin: [24, 0, 24, 12],
          fontSize: 9,
          color: "#64748b",
        }),
      };

      await pdfMake.createPdf(docDefinition).download(`dang-ky-mon-hoc-${studentCode}.pdf`);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Không thể xuất file PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  function handleExportRosterPdf() {
    if (!selectedRoster?.course) {
      return;
    }

    const course = selectedRoster.course;
    const courseCode = course.courseId ?? course._id ?? "lop-hoc";
    const teacherName = resolveTeacherLabel(course.teacherId);
    const semesterName = resolveSemesterLabel(course.semesterId);

    const rosterRows = selectedRoster.registrations.map((registration) => {
      const student = typeof registration.studentId === "string" ? null : registration.studentId;

      return [
        resolveStudentKey(registration.studentId) || "-",
        resolveStudentLabel(registration.studentId),
        student?.email || "-",
        student?.phone || "-",
        student?.department || "-",
        student?.academicYear || "-",
        formatDateTime(registration.createdAt),
      ];
    });

    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [24, 28, 24, 24],
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        lineHeight: 1.25,
      },
      content: [
        { text: "Danh sách sinh viên lớp học", style: "title" },
        {
          columns: [
            [
              { text: `Môn học: ${course.name}` },
              { text: `Mã lớp: ${courseCode}` },
              { text: `Giảng viên: ${teacherName}` },
              { text: `Học kỳ: ${semesterName}` },
              { text: `Tổng sinh viên: ${formatNumber(selectedRoster.total)}` },
              { text: `Ngày xuất: ${formatDateTime(new Date())}` },
            ],
          ],
          margin: [0, 6, 0, 12],
        },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", "auto", "*", "auto", "auto"],
            body: [
              [
                { text: "Mã SV", style: "tableHeader" },
                { text: "Họ tên", style: "tableHeader" },
                { text: "Email", style: "tableHeader" },
                { text: "SĐT", style: "tableHeader" },
                { text: "Khoa", style: "tableHeader" },
                { text: "Niên khóa", style: "tableHeader" },
                { text: "Ngày đăng ký", style: "tableHeader" },
              ],
              ...(rosterRows.length > 0 ? rosterRows : [["-", "Chưa có sinh viên", "-", "-", "-", "-", "-"]]),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? "#0f172a" : rowIndex % 2 === 0 ? "#f8fafc" : null),
            hLineColor: () => "#e2e8f0",
            vLineColor: () => "#e2e8f0",
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ],
      styles: {
        title: {
          fontSize: 18,
          bold: true,
          color: "#0f172a",
          letterSpacing: 0.2,
        },
        tableHeader: {
          bold: true,
          color: "#ffffff",
          fillColor: "#0f172a",
        },
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `${currentPage} / ${pageCount}`,
        alignment: "right",
        margin: [24, 0, 24, 12],
        fontSize: 9,
        color: "#64748b",
      }),
    };

    pdfMake.createPdf(docDefinition).download(`danh-sach-sinh-vien-${courseCode}.pdf`);
  }

  const studentSummaryCards = [
    {
      label: "Môn trong học kỳ",
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
      label: "Lớp học kỳ này",
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
      ? "Chọn lớp đang mở để đăng ký và theo dõi các môn đã đăng ký."
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

      {studentRegistrationClosed ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-300">
          Hiện chưa có lớp nào đang mở để đăng ký. Hãy chờ admin mở lớp sang trạng thái đang mở.
        </div>
      ) : null}

      {role === "admin" ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Quản trị</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Quản lý lớp học</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Admin có thể thêm sinh viên vào lớp, đồng thời khóa hoặc mở lại lớp đang mở, lớp đã đầy, hoặc lớp đã đóng.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_auto]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Sinh viên</span>
              <select
                value={selectedAdminStudentId}
                onChange={(event) => setSelectedAdminStudentId(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                disabled={adminEnrollmentLoading || adminStudents.length === 0}
              >
                {adminStudents.length > 0 ? (
                  adminStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.fullName || student.userId || student.email}
                    </option>
                  ))
                ) : (
                  <option value="">Không có sinh viên</option>
                )}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Lớp học</span>
              <select
                value={selectedAdminCourseId}
                onChange={(event) => setSelectedAdminCourseId(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                disabled={adminEnrollmentLoading || courses.length === 0}
              >
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} · {course.courseId} · {formatNumber(course.currentStudents)}/{formatNumber(course.maxStudents)} · {formatStatusLabel(resolveCourseDisplayStatus(course))}
                    </option>
                  ))
                ) : (
                  <option value="">Không có lớp học</option>
                )}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void handleAdminEnroll()}
              disabled={adminEnrollmentLoading || adminStudents.length === 0 || courses.length === 0}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition",
                adminEnrollmentLoading || adminStudents.length === 0 || courses.length === 0
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              <UserPlus className="h-4 w-4" />
              {adminEnrollmentLoading ? "Đang chèn..." : "Thêm sinh viên"}
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-muted/30 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Khóa học đang chọn</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  {courses.find((course) => course._id === selectedAdminCourseId)?.name ?? "Chưa chọn lớp"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {courses.find((course) => course._id === selectedAdminCourseId)?.courseId ?? "-"}
                </p>
              </div>

              {courses.find((course) => course._id === selectedAdminCourseId) ? (
                <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", courses.find((course) => course._id === selectedAdminCourseId) ? (courses.find((course) => course._id === selectedAdminCourseId)!.status === "full" ? "bg-destructive/10 text-destructive border-destructive/20" : courses.find((course) => course._id === selectedAdminCourseId)!.status === "closed" || courses.find((course) => course._id === selectedAdminCourseId)!.status === "planned" ? "bg-muted text-muted-foreground border-border" : "bg-emerald-500/10 text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-500/20") : "bg-muted text-muted-foreground border-border")}>{formatStatusLabel(courses.find((course) => course._id === selectedAdminCourseId)?.status)}</span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_auto_auto]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Chọn lớp để thao tác</span>
                <select
                  value={selectedAdminCourseId}
                  onChange={(event) => setSelectedAdminCourseId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  disabled={courses.length === 0}
                >
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name} · {course.courseId} · {formatNumber(course.currentStudents)}/{formatNumber(course.maxStudents)} · {formatStatusLabel(course.status)}
                      </option>
                    ))
                  ) : (
                    <option value="">Không có lớp học</option>
                  )}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  const selectedCourse = courses.find((course) => course._id === selectedAdminCourseId);
                  if (selectedCourse) {
                    void handleAdminOpenCourse(selectedCourse);
                  }
                }}
                disabled={!selectedAdminCourseId || busyCourseId === selectedAdminCourseId}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition",
                  !selectedAdminCourseId || busyCourseId === selectedAdminCourseId
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-emerald-600 text-white hover:bg-emerald-500",
                )}
              >
                Mở lớp
              </button>

              <button
                type="button"
                onClick={() => {
                  const selectedCourse = courses.find((course) => course._id === selectedAdminCourseId);
                  if (selectedCourse) {
                    void handleAdminCloseCourse(selectedCourse);
                  }
                }}
                disabled={!selectedAdminCourseId || busyCourseId === selectedAdminCourseId}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition",
                  !selectedAdminCourseId || busyCourseId === selectedAdminCourseId
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-amber-600 text-white hover:bg-amber-500",
                )}
              >
                Khóa lớp
              </button>
            </div>
          </div>
        </section>
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <BookOpen className="h-4 w-4" />
                <h2 className="text-lg font-semibold text-foreground">Môn học có thể đăng ký</h2>
              </div>

              <button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={pdfLoading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                  pdfLoading ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-slate-900 text-white hover:bg-slate-800",
                )}
              >
                <Download className="h-4 w-4" />
                {pdfLoading ? "Đang xuất..." : "Xuất PDF"}
              </button>
            </div>
            <ResourceTable
              loading={pageLoading}
              error={null}
              rows={availableStudentCourses}
              rowKey={(course) => course._id}
              emptyMessage="Chưa có lớp nào đang mở để đăng ký."
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
                  header: "Tín chỉ",
                  render: (course) => <span className="font-medium text-foreground">{formatNumber(course.credits)}</span>,
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
                  header: "Giá",
                  render: (course) => <span className="font-medium text-foreground">{formatCurrency(course.price)}</span>,
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
                    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", courseStatusClass(resolveCourseDisplayStatus(course)))}>
                      {formatStatusLabel(resolveCourseDisplayStatus(course))}
                    </span>
                  ),
                },
                {
                  header: "Hành động",
                  render: (course) => {
                    const alreadyRegistered = courseIdsRegisteredByStudent.has(course._id);
                    const displayStatus = resolveCourseDisplayStatus(course);
                    const disabled = alreadyRegistered || displayStatus !== "open" || busyCourseId === course._id;

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
                        {alreadyRegistered
                          ? "Đã đăng ký"
                          : displayStatus === "open"
                            ? "Đăng ký"
                            : displayStatus === "full"
                              ? "Đã đầy"
                              : formatStatusLabel(displayStatus)}
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
                  header: "Tín chỉ",
                  render: (registration) => (
                    <span className="font-medium text-foreground">
                      {typeof registration.courseId === "string" ? "-" : formatNumber(registration.courseId.credits)}
                    </span>
                  ),
                },
                {
                  header: "Học kỳ",
                  render: (registration) => <span className="text-foreground">{resolveSemesterLabel(registration.semesterId)}</span>,
                },
                {
                  header: "Giá",
                  render: (registration) => (
                    <span className="font-medium text-foreground">
                      {typeof registration.courseId === "string" ? "-" : resolveCoursePrice(registration.courseId)}
                    </span>
                  ),
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
                  header: "Giá",
                  render: (course) => <span className="font-medium text-foreground">{formatCurrency(course.price)}</span>,
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
                    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", courseStatusClass(resolveCourseDisplayStatus(course)))}>
                      {formatStatusLabel(resolveCourseDisplayStatus(course))}
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
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng sinh viên</p>
                      <p className="mt-1 font-semibold">{formatNumber(selectedRoster.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(selectedRoster.course.currentStudents)} đã ghi trong khóa học</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportRosterPdf}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4" />
                      Xuất danh sách
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Mở lớp</p>
                      <p className="mt-1 font-semibold">{formatDateTime(selectedRoster.course.openedAt)}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Đủ điều kiện khóa</p>
                      <p className="mt-1 font-semibold">{formatDateTime(selectedRoster.course.qualifiedAt)}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Đã đầy từ</p>
                      <p className="mt-1 font-semibold">{formatDateTime(selectedRoster.course.fullAt)}</p>
                    </div>
                  </div>
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
                  ...(role === "admin"
                    ? [
                        {
                          header: "Hành động",
                          render: (registration: RegistrationRecord) => (
                            <button
                              type="button"
                              onClick={() => void handleAdminRemove(registration)}
                              disabled={busyRegistrationId === registration._id}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                                busyRegistrationId === registration._id
                                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                              )}
                            >
                              {busyRegistrationId === registration._id ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : null}
                              Xóa khỏi lớp
                            </button>
                          ),
                        },
                      ]
                    : []),
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
              {
                header: "Hành động",
                render: (registration) => {
                  const canRemove = registration.status === "registered";

                  return canRemove ? (
                    <button
                      type="button"
                      onClick={() => void handleAdminRemove(registration)}
                      disabled={busyRegistrationId === registration._id}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                        busyRegistrationId === registration._id
                          ? "cursor-not-allowed bg-muted text-muted-foreground"
                          : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                      )}
                    >
                      {busyRegistrationId === registration._id ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : null}
                      Xóa khỏi lớp
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Không áp dụng</span>
                  );
                },
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
