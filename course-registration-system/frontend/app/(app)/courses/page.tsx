"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock3, Layers3, Loader2, PlusCircle, Trash2 } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { useAuth } from "@/components/layout/AuthProvider";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { cn, ensureArray } from "@/lib/utils";
import { formatCreditBreakdown, formatCurrency, formatNumber, formatScheduleDay, formatScheduleText, formatStatusLabel, resolveCourseDisplayStatus, resolveCourseLifecycleCountdown } from "@/lib/format";
import type { CourseLifecycleSettings, CourseRecord, SemesterSummary, TeacherRecord } from "@/lib/types";

type CourseFormState = {
  name: string;
  credits: string;
  theoryCredits: string;
  practiceCredits: string;
  department: string;
  description: string;
  teacherId: string;
  semesterId: string;
  dayOfWeek: string;
  startPeriod: string;
  endPeriod: string;
  room: string;
  maxStudents: string;
};

type CourseCreatePayload = {
  name: string;
  credits: number;
  theoryCredits?: number;
  practiceCredits?: number;
  department?: string;
  description?: string;
  teacherId: string;
  semesterId: string;
  schedule: {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    room?: string;
  };
  maxStudents: number;
  status: "planned";
};

const DEFAULT_COURSE_FORM: CourseFormState = {
  name: "",
  credits: "3",
  theoryCredits: "",
  practiceCredits: "",
  department: "",
  description: "",
  teacherId: "",
  semesterId: "",
  dayOfWeek: "1",
  startPeriod: "1",
  endPeriod: "2",
  room: "",
  maxStudents: "30",
};

const INPUT_CLASS_NAME =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10";
const TEXTAREA_CLASS_NAME =
  "min-h-24 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10";
const SELECT_CLASS_NAME = `${INPUT_CLASS_NAME} appearance-none`;

const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7];
const PERIODS = Array.from({ length: 12 }, (_, index) => index + 1);

function createDefaultCourseForm(): CourseFormState {
  return { ...DEFAULT_COURSE_FORM };
}

function parseOptionalInteger(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isInteger(parsedValue) ? parsedValue : Number.NaN;
}

function formatTeacherOption(teacher: TeacherRecord) {
  const code = teacher.teacherId || teacher._id;
  const inactiveSuffix = teacher.isActive === false ? " (đã khóa)" : "";

  return `${code} · ${teacher.fullName}${inactiveSuffix}`;
}

function formatSemesterOption(semester: SemesterSummary) {
  const code = semester.semesterId || semester._id || "HK";
  const name = semester.name || "Học kỳ";
  const status = semester.status ? ` (${semester.status})` : "";

  return `${code} · ${name}${status}`;
}

function resolveLabel(value: CourseRecord["teacherId"] | CourseRecord["semesterId"]): string {
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

  if ("teacherId" in value && value.teacherId) {
    return value.teacherId;
  }

  if ("semesterId" in value && typeof value.semesterId === "string" && value.semesterId) {
    return value.semesterId;
  }

  return "-";
}

function statusClass(status: string) {
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

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [courseLifecycle, setCourseLifecycle] = useState<CourseLifecycleSettings | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [semesters, setSemesters] = useState<SemesterSummary[]>([]);
  const [courseForm, setCourseForm] = useState<CourseFormState>(() => createDefaultCourseForm());
  const [loading, setLoading] = useState(true);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [deletingCourseId, setDeletingCourseId] = useState("");
  const [updatingCourseId, setUpdatingCourseId] = useState("");
  const isAdmin = user?.role === "admin";
  const hasReferenceData = teachers.length > 0 && semesters.length > 0;

  function updateCourseFormField<K extends keyof CourseFormState>(field: K, value: CourseFormState[K]) {
    setCourseForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await apiFetch<CourseRecord[]>("/courses?page=1&limit=500");
      setCourses(ensureArray<CourseRecord>(response.data));

      if (isAdmin) {
        try {
          const [lifecycleResponse, teacherResponse, semesterResponse] = await Promise.all([
            apiFetch<CourseLifecycleSettings>("/courses/lifecycle"),
            apiFetch<TeacherRecord[]>("/teachers?page=1&limit=500"),
            apiFetch<SemesterSummary[]>("/semesters?page=1&limit=500"),
          ]);

          setCourseLifecycle(lifecycleResponse.data ?? null);
          setTeachers(ensureArray<TeacherRecord>(teacherResponse.data));
          setSemesters(ensureArray<SemesterSummary>(semesterResponse.data));
        } catch (lifecycleError) {
          if (lifecycleError instanceof ApiError && lifecycleError.status === 401) {
            clearAuthToken();
            router.replace("/login");
            return;
          }

          setCourseLifecycle(null);
          setTeachers([]);
          setSemesters([]);
          setError(lifecycleError instanceof Error ? lifecycleError.message : "Không tải được dữ liệu quản trị");
        }
      } else {
        setCourseLifecycle(null);
        setTeachers([]);
        setSemesters([]);
      }
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không tải được danh sách khóa học");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, router]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const courseStats = useMemo(() => {
    const open = courses.filter((course) => resolveCourseDisplayStatus(course) === "open").length;
    const full = courses.filter((course) => resolveCourseDisplayStatus(course) === "full").length;
    const closed = courses.filter((course) => {
      const displayStatus = resolveCourseDisplayStatus(course);
      return displayStatus === "closed" || displayStatus === "planned";
    }).length;
    const totalCapacity = courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0);

    return { open, full, closed, totalCapacity };
  }, [courses]);

  async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin || creatingCourse) {
      return;
    }

    setError("");
    setStatusMessage("");

    const name = courseForm.name.trim();
    const credits = Number(courseForm.credits);
    const theoryCredits = parseOptionalInteger(courseForm.theoryCredits);
    const practiceCredits = parseOptionalInteger(courseForm.practiceCredits);
    const department = courseForm.department.trim();
    const description = courseForm.description.trim();
    const teacherId = courseForm.teacherId.trim();
    const semesterId = courseForm.semesterId.trim();
    const dayOfWeek = Number(courseForm.dayOfWeek);
    const startPeriod = Number(courseForm.startPeriod);
    const endPeriod = Number(courseForm.endPeriod);
    const room = courseForm.room.trim();
    const maxStudents = Number(courseForm.maxStudents);

    if (!name) {
      setError("Vui lòng nhập tên lớp học.");
      return;
    }

    if (!Number.isInteger(credits) || credits < 1 || credits > 6) {
      setError("Tín chỉ phải là số nguyên từ 1 đến 6.");
      return;
    }

    if (theoryCredits !== null && (!Number.isInteger(theoryCredits) || theoryCredits < 0)) {
      setError("Tín chỉ lý thuyết phải là số nguyên không âm.");
      return;
    }

    if (practiceCredits !== null && (!Number.isInteger(practiceCredits) || practiceCredits < 0)) {
      setError("Tín chỉ thực hành phải là số nguyên không âm.");
      return;
    }

    if (!teacherId) {
      setError("Vui lòng chọn giảng viên phụ trách.");
      return;
    }

    if (!semesterId) {
      setError("Vui lòng chọn học kỳ.");
      return;
    }

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      setError("Ngày học phải nằm trong khoảng 1 đến 7.");
      return;
    }

    if (
      !Number.isInteger(startPeriod) ||
      !Number.isInteger(endPeriod) ||
      startPeriod < 1 ||
      startPeriod > 12 ||
      endPeriod < 1 ||
      endPeriod > 12
    ) {
      setError("Tiết học phải là số nguyên từ 1 đến 12.");
      return;
    }

    if (startPeriod > endPeriod) {
      setError("Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.");
      return;
    }

    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      setError("Sĩ số tối đa phải là số nguyên lớn hơn 0.");
      return;
    }

    const payload: CourseCreatePayload = {
      name,
      credits,
      ...(theoryCredits !== null ? { theoryCredits } : {}),
      ...(practiceCredits !== null ? { practiceCredits } : {}),
      ...(department ? { department } : {}),
      ...(description ? { description } : {}),
      teacherId,
      semesterId,
      schedule: {
        dayOfWeek,
        startPeriod,
        endPeriod,
        ...(room ? { room } : {}),
      },
      maxStudents,
      status: "planned",
    };

    setCreatingCourse(true);

    try {
      const response = await apiFetch<CourseRecord>("/courses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdCourseName = response.data?.name ?? name;
      setCourseForm(createDefaultCourseForm());
      await loadCourses();
      setStatusMessage(`Đã tạo lớp ${createdCourseName}`);
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể tạo lớp học");
    } finally {
      setCreatingCourse(false);
    }
  }

  async function handleDelete(course: CourseRecord) {
    if (!window.confirm(`Xóa lớp ${course.name}? Thao tác này sẽ hủy các đăng ký liên quan.`)) {
      return;
    }

    setDeletingCourseId(course._id);
    setError("");
    setStatusMessage("");

    try {
      await apiFetch(`/courses/${course._id}`, {
        method: "DELETE",
      });

      await loadCourses();
      setStatusMessage(`Đã xóa lớp ${course.name}`);
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể xóa lớp học");
    } finally {
      setDeletingCourseId("");
    }
  }

  async function handleUpdateCourse(course: CourseRecord, payload: Record<string, unknown>, successMessage: string) {
    setUpdatingCourseId(course._id);
    setError("");
    setStatusMessage("");

    try {
      await apiFetch(`/courses/${course._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await loadCourses();
      setStatusMessage(successMessage);
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        clearAuthToken();
        router.replace("/login");
        return;
      }

      setError(fetchError instanceof Error ? fetchError.message : "Không thể cập nhật khóa học");
    } finally {
      setUpdatingCourseId("");
    }
  }

  async function handleChangeCapacity(course: CourseRecord) {
    const nextCapacity = window.prompt(`Nhập sĩ số mới cho lớp ${course.name}`, String(course.maxStudents));
    if (nextCapacity === null) {
      return;
    }

    const parsedCapacity = Number(nextCapacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      setError("Sĩ số phải là số nguyên lớn hơn 0");
      return;
    }

    await handleUpdateCourse(course, { maxStudents: parsedCapacity }, `Đã cập nhật sĩ số lớp ${course.name}`);
  }

  async function handleOpenCourse(course: CourseRecord) {
    const confirmed = window.confirm(`Mở lớp ${course.name}?`);
    if (!confirmed) {
      return;
    }

    await handleUpdateCourse(course, { status: "open" }, `Đã mở lại lớp ${course.name}`);
  }

  async function handleAllowTeaching(course: CourseRecord) {
    const confirmed = window.confirm(`Cho phép dạy lớp ${course.name}?`);
    if (!confirmed) {
      return;
    }

    await handleUpdateCourse(course, { status: "ongoing" }, `Đã cho phép dạy lớp ${course.name}`);
  }

  async function handleCloseCourse(course: CourseRecord) {
    const confirmed = window.confirm(`Khóa lớp ${course.name}?`);
    if (!confirmed) {
      return;
    }

    await handleUpdateCourse(course, { status: "closed" }, `Đã khóa lớp ${course.name}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Danh mục</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Khóa học</h1>
            <p className="mt-2 text-sm text-muted-foreground">Kiểm tra sức chứa, lịch học và trạng thái hiện tại của khóa học từ hệ thống phía sau.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng số</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(courses.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Đang mở</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(courseStats.open)}</p>
            </div>
            <div className="rounded-2xl bg-destructive/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-destructive">Đã đầy</p>
              <p className="mt-1 text-xl font-semibold text-destructive">{formatNumber(courseStats.full)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Sức chứa</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(courseStats.totalCapacity)}</p>
            </div>
          </div>
        </div>
      </section>

      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300">
          {statusMessage}
        </div>
      ) : null}

      {isAdmin ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Quản trị</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Tạo lớp học mới</h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Nhập thông tin lớp học, giảng viên phụ trách, học kỳ và lịch học. Mã lớp sẽ được hệ thống sinh tự động.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">Lớp mới sẽ được khởi tạo ở trạng thái chờ mở (planned) để bạn có thể mở lớp sau.</p>
          </div>

          {!hasReferenceData ? (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              Cần có ít nhất một giảng viên và một học kỳ trước khi tạo lớp học.
            </div>
          ) : null}

          <form className="mt-6 space-y-6" onSubmit={handleCreateCourse}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-name">
                  Tên lớp học
                </label>
                <input
                  id="course-name"
                  value={courseForm.name}
                  onChange={(event) => updateCourseFormField("name", event.target.value)}
                  placeholder="Ví dụ: Lập trình Web"
                  className={INPUT_CLASS_NAME}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-department">
                  Khoa / bộ môn
                </label>
                <input
                  id="course-department"
                  value={courseForm.department}
                  onChange={(event) => updateCourseFormField("department", event.target.value)}
                  placeholder="Ví dụ: Công nghệ thông tin"
                  className={INPUT_CLASS_NAME}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-credits">
                  Tổng tín chỉ
                </label>
                <input
                  id="course-credits"
                  type="number"
                  min="1"
                  max="6"
                  step="1"
                  value={courseForm.credits}
                  onChange={(event) => updateCourseFormField("credits", event.target.value)}
                  className={INPUT_CLASS_NAME}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-theory-credits">
                  Tín chỉ lý thuyết
                </label>
                <input
                  id="course-theory-credits"
                  type="number"
                  min="0"
                  step="1"
                  value={courseForm.theoryCredits}
                  onChange={(event) => updateCourseFormField("theoryCredits", event.target.value)}
                  placeholder="Tuỳ chọn"
                  className={INPUT_CLASS_NAME}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-practice-credits">
                  Tín chỉ thực hành
                </label>
                <input
                  id="course-practice-credits"
                  type="number"
                  min="0"
                  step="1"
                  value={courseForm.practiceCredits}
                  onChange={(event) => updateCourseFormField("practiceCredits", event.target.value)}
                  placeholder="Tuỳ chọn"
                  className={INPUT_CLASS_NAME}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-max-students">
                  Sĩ số tối đa
                </label>
                <input
                  id="course-max-students"
                  type="number"
                  min="1"
                  step="1"
                  value={courseForm.maxStudents}
                  onChange={(event) => updateCourseFormField("maxStudents", event.target.value)}
                  className={INPUT_CLASS_NAME}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-teacher">
                  Giảng viên phụ trách
                </label>
                <select
                  id="course-teacher"
                  value={courseForm.teacherId}
                  onChange={(event) => updateCourseFormField("teacherId", event.target.value)}
                  className={SELECT_CLASS_NAME}
                >
                  <option value="">Chọn giảng viên</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {formatTeacherOption(teacher)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-semester">
                  Học kỳ
                </label>
                <select
                  id="course-semester"
                  value={courseForm.semesterId}
                  onChange={(event) => updateCourseFormField("semesterId", event.target.value)}
                  className={SELECT_CLASS_NAME}
                >
                  <option value="">Chọn học kỳ</option>
                  {semesters.map((semester) => (
                    <option key={semester._id || semester.semesterId || semester.name} value={semester._id || semester.semesterId || ""}>
                      {formatSemesterOption(semester)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-day-of-week">
                  Ngày học
                </label>
                <select
                  id="course-day-of-week"
                  value={courseForm.dayOfWeek}
                  onChange={(event) => updateCourseFormField("dayOfWeek", event.target.value)}
                  className={SELECT_CLASS_NAME}
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {formatScheduleDay(day)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-start-period">
                  Tiết bắt đầu
                </label>
                <select
                  id="course-start-period"
                  value={courseForm.startPeriod}
                  onChange={(event) => updateCourseFormField("startPeriod", event.target.value)}
                  className={SELECT_CLASS_NAME}
                >
                  {PERIODS.map((period) => (
                    <option key={period} value={period}>
                      Tiết {period}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-end-period">
                  Tiết kết thúc
                </label>
                <select
                  id="course-end-period"
                  value={courseForm.endPeriod}
                  onChange={(event) => updateCourseFormField("endPeriod", event.target.value)}
                  className={SELECT_CLASS_NAME}
                >
                  {PERIODS.map((period) => (
                    <option key={period} value={period}>
                      Tiết {period}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-room">
                  Phòng học
                </label>
                <input
                  id="course-room"
                  value={courseForm.room}
                  onChange={(event) => updateCourseFormField("room", event.target.value)}
                  placeholder="Ví dụ: A1.02"
                  className={INPUT_CLASS_NAME}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="course-description">
                Mô tả
              </label>
              <textarea
                id="course-description"
                value={courseForm.description}
                onChange={(event) => updateCourseFormField("description", event.target.value)}
                placeholder="Mô tả ngắn gọn về lớp học"
                rows={4}
                className={TEXTAREA_CLASS_NAME}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-muted-foreground">Lưu ý: lớp mới mặc định ở trạng thái planned và courseId sẽ được sinh tự động.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCourseForm(createDefaultCourseForm())}
                  className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  Làm mới
                </button>

                <button
                  type="submit"
                  disabled={creatingCourse || loading || !hasReferenceData}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    creatingCourse || loading || !hasReferenceData
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {creatingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  {creatingCourse ? "Đang tạo..." : "Tạo lớp học"}
                </button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      <ResourceTable
        loading={loading}
        error={error}
        rows={courses}
        rowKey={(course) => course._id}
        emptyMessage="Không tìm thấy khóa học nào."
        columns={[
          {
            header: "Khóa học",
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
                <p className="font-medium text-foreground">{resolveLabel(course.teacherId)}</p>
                <p className="text-xs text-muted-foreground">{typeof course.teacherId === "string" ? "-" : course.teacherId.teacherId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Học kỳ",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{resolveLabel(course.semesterId)}</p>
                <p className="text-xs text-muted-foreground">{typeof course.semesterId === "string" ? "-" : course.semesterId.semesterId || "-"}</p>
              </div>
            ),
          },
          {
            header: "Lịch học",
            render: (course) => (
              <div className="inline-flex items-center gap-2 text-foreground">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span>{formatScheduleText(course.schedule)}</span>
              </div>
            ),
          },
          {
            header: "Tín chỉ",
            render: (course) => (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                {formatCreditBreakdown(course)}
              </span>
            ),
          },
          {
            header: "Giá",
            render: (course) => <span className="font-medium text-foreground">{formatCurrency(course.price)}</span>,
          },
          {
            header: "Sĩ số",
            render: (course) => (
              <div className="space-y-1">
                <p className="font-medium text-foreground">{formatNumber(course.currentStudents)} / {formatNumber(course.maxStudents)}</p>
                <p className="text-xs text-muted-foreground">{course.currentStudents >= course.maxStudents ? "Đã đầy" : "Còn chỗ"}</p>
              </div>
            ),
          },
          {
            header: "Trạng thái",
            render: (course) => (
              <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", statusClass(resolveCourseDisplayStatus(course)))}>
                <Layers3 className="mr-1 h-3.5 w-3.5" />
                {formatStatusLabel(resolveCourseDisplayStatus(course))}
              </span>
            ),
          },
          ...(isAdmin
            ? [
                {
                  header: "Tự động",
                  render: (course: CourseRecord) => {
                    const lifecycleText = resolveCourseLifecycleCountdown(course, courseLifecycle ?? undefined);

                    if (lifecycleText === "-") {
                      return <span className="text-xs text-muted-foreground">-</span>;
                    }

                    const lifecycleClass = lifecycleText.startsWith("Khóa")
                      ? "bg-amber-500/10 text-amber-700 border-amber-200/60 dark:text-amber-300 dark:border-amber-500/20"
                      : "bg-rose-500/10 text-rose-700 border-rose-200/60 dark:text-rose-300 dark:border-rose-500/20";

                    return <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", lifecycleClass)}>{lifecycleText}</span>;
                  },
                },
              ]
            : []),
          ...(isAdmin
            ? [
                {
                  header: "Hành động",
                  render: (course: CourseRecord) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={updatingCourseId === course._id}
                        onClick={() => void handleChangeCapacity(course)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                          updatingCourseId === course._id
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {updatingCourseId === course._id ? "Đang sửa..." : "Sửa sĩ số"}
                      </button>

                      {course.status === "planned" || course.status === "closed" ? (
                        <button
                          type="button"
                          disabled={updatingCourseId === course._id}
                          onClick={() => void handleOpenCourse(course)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                            updatingCourseId === course._id
                              ? "cursor-not-allowed bg-muted text-muted-foreground"
                              : "bg-emerald-600 text-white hover:bg-emerald-500",
                          )}
                        >
                          {updatingCourseId === course._id ? "Đang mở..." : course.status === "planned" ? "Mở lớp" : "Mở lại"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={updatingCourseId === course._id}
                        onClick={() => void handleAllowTeaching(course)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                          updatingCourseId === course._id
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "bg-violet-600 text-white hover:bg-violet-500",
                        )}
                      >
                        {updatingCourseId === course._id ? "Đang duyệt..." : "Cho phép dạy"}
                      </button>

                      {course.status === "closed" || course.status === "planned" ? null : (
                        <button
                          type="button"
                          disabled={updatingCourseId === course._id}
                          onClick={() => void handleCloseCourse(course)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                            updatingCourseId === course._id
                              ? "cursor-not-allowed bg-muted text-muted-foreground"
                              : "bg-amber-600 text-white hover:bg-amber-500",
                          )}
                        >
                          {updatingCourseId === course._id ? "Đang khóa..." : "Khóa lớp"}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={deletingCourseId === course._id}
                        onClick={() => void handleDelete(course)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                          deletingCourseId === course._id
                            ? "cursor-not-allowed bg-muted text-muted-foreground"
                            : "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingCourseId === course._id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
