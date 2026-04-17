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

export function getInitials(value?: string | null) {
  if (!value) {
    return "ED";
  }

  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "ED";
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

  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}