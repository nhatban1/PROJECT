export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCreditBreakdown(course?: { credits?: number | null; theoryCredits?: number | null; practiceCredits?: number | null }) {
  if (!course || typeof course.credits !== "number") {
    return "-";
  }

  const totalCredits = course.credits;
  const theoryCredits = typeof course.theoryCredits === "number" ? course.theoryCredits : 0;
  const practiceCredits = typeof course.practiceCredits === "number" ? course.practiceCredits : 0;

  if (theoryCredits > 0 || practiceCredits > 0) {
    const parts = [];

    if (theoryCredits > 0) {
      parts.push(`${formatNumber(theoryCredits)} LT`);
    }

    if (practiceCredits > 0) {
      parts.push(`${formatNumber(practiceCredits)} TH`);
    }

    return `${formatNumber(totalCredits)} (${parts.join(" + ")})`;
  }

  return formatNumber(totalCredits);
}

type CourseStatusSource = {
  status?: string | null;
  currentStudents?: number | null;
  maxStudents?: number | null;
  semesterId?:
    | string
    | {
        startDate?: string | Date | null;
      }
    | null;
};

  type CourseLifecycleSource = {
    fullToCloseDays?: number | null;
    lowEnrollmentMinStudents?: number | null;
    lowEnrollmentCancelDays?: number | null;
  };

  type CourseLifecycleTimingSource = CourseStatusSource & {
    openedAt?: string | Date | null;
    fullAt?: string | Date | null;
    createdAt?: string | Date | null;
  };

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function toDate(value?: string | Date | null) {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

export function resolveCourseDisplayStatus(course?: CourseStatusSource) {
  if (!course) {
    return "";
  }

  const normalizedStatus = course.status?.trim().toLowerCase();
  const currentStudents = typeof course.currentStudents === "number" ? course.currentStudents : null;
  const maxStudents = typeof course.maxStudents === "number" ? course.maxStudents : null;

  if (normalizedStatus === "closed" || normalizedStatus === "planned") {
    return normalizedStatus;
  }

  if (currentStudents !== null && maxStudents !== null && currentStudents >= maxStudents) {
    return "full";
  }

  return "open";
}

export function resolveCourseLifecycleCountdown(course?: CourseLifecycleTimingSource, lifecycle?: CourseLifecycleSource, referenceDate = new Date()) {
  if (!course || !lifecycle) {
    return "-";
  }

  const normalizedStatus = course.status?.trim().toLowerCase();
  const currentStudents = typeof course.currentStudents === "number" ? course.currentStudents : null;
  const maxStudents = typeof course.maxStudents === "number" ? course.maxStudents : null;

  if (normalizedStatus === "closed" || normalizedStatus === "planned") {
    return "-";
  }

  const isFull = normalizedStatus === "full" || (currentStudents !== null && maxStudents !== null && currentStudents >= maxStudents);

  if (isFull) {
    const fullToCloseDays = typeof lifecycle.fullToCloseDays === "number" ? lifecycle.fullToCloseDays : null;
    if (fullToCloseDays === null) {
      return "-";
    }

    const fullAt = toDate(course.fullAt ?? course.createdAt ?? null);
    if (!fullAt) {
      return `Khóa sau ${formatNumber(fullToCloseDays)} ngày`;
    }

    const remainingDays = Math.max(Math.ceil((fullAt.getTime() + fullToCloseDays * MS_PER_DAY - referenceDate.getTime()) / MS_PER_DAY), 0);
    return `Khóa sau ${formatNumber(remainingDays)} ngày`;
  }

  const lowEnrollmentMinStudents = typeof lifecycle.lowEnrollmentMinStudents === "number" ? lifecycle.lowEnrollmentMinStudents : null;
  const lowEnrollmentCancelDays = typeof lifecycle.lowEnrollmentCancelDays === "number" ? lifecycle.lowEnrollmentCancelDays : null;

  if (
    lowEnrollmentMinStudents !== null &&
    lowEnrollmentCancelDays !== null &&
    currentStudents !== null &&
    currentStudents < lowEnrollmentMinStudents
  ) {
    const openedAt = toDate(course.openedAt ?? course.createdAt ?? null);
    if (!openedAt) {
      return `Hủy sau ${formatNumber(lowEnrollmentCancelDays)} ngày`;
    }

    const remainingDays = Math.max(Math.ceil((openedAt.getTime() + lowEnrollmentCancelDays * MS_PER_DAY - referenceDate.getTime()) / MS_PER_DAY), 0);
    return `Hủy sau ${formatNumber(remainingDays)} ngày`;
  }

  return "-";
}

export function getInitials(value?: string | null) {
  if (!value) {
    return "IU";
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "IU";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatScheduleDay(dayOfWeek?: number) {
  const days = ["", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "CN"];
  if (!dayOfWeek || dayOfWeek < 1 || dayOfWeek > 7) {
    return "-";
  }

  return days[dayOfWeek];
}

export function formatScheduleText(schedule?: {
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  room?: string;
}) {
  if (!schedule) {
    return "-";
  }

  const room = schedule.room ? `, ${schedule.room}` : "";
  return `${formatScheduleDay(schedule.dayOfWeek)} · Tiết ${schedule.startPeriod}-${schedule.endPeriod}${room}`;
}

export function formatStatusLabel(value?: string | null) {
  if (!value) {
    return "-";
  }

  const normalized = value.trim().toLowerCase();
  const translations: Record<string, string> = {
    open: "Đang mở",
    ongoing: "Đang dạy",
    full: "Đã đầy",
    closed: "Đã đóng",
    planned: "Đang lên kế hoạch",
    available: "Còn chỗ",
    filled: "Đã đầy",
    registered: "Đã đăng ký",
    cancelled: "Đã hủy",
    pending: "Đang chờ",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    active: "Đang hoạt động",
    inactive: "Không hoạt động",
    draft: "Bản nháp",
    completed: "Hoàn thành",
    student: "Sinh viên",
    teacher: "Giảng viên",
    admin: "Quản trị viên",
  };

  return translations[normalized] ?? translations[normalized.replace(/_/g, " ")] ?? value.replace(/_/g, " ");
}