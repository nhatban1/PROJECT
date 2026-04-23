export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  role?: "student" | "teacher" | "admin" | null;
  userId?: string | null;
  phone?: string | null;
  department?: string | null;
  academicYear?: string | null;
}

export interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  registrationCount: number;
}

export interface CourseLifecycleSettings {
  plannedToOpenDays: number;
  plannedToOpenMinutes?: number;
  fullToCloseDays: number;
  fullToCloseMinutes?: number;
  lowEnrollmentMinStudents: number;
  lowEnrollmentCancelDays: number;
  lowEnrollmentCancelMinutes?: number;
}

export interface AdminDashboardData {
  role: "admin";
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  registrationCount: number;
}

export interface StudentDashboardData {
  role: "student";
  activeSemester?: SemesterSummary | null;
  registeredCourseCount: number;
  openCourseCount: number;
  registrations: RegistrationRecord[];
}

export interface TeacherDashboardCourseSummary {
  _id: string;
  courseId: string;
  name: string;
  price?: number;
  currentStudents: number;
  maxStudents: number;
  status: "open" | "planned" | "ongoing" | "closed" | "full";
  semesterId?: SemesterSummary | string;
  schedule?: {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    room?: string;
  };
}

export interface TeacherDashboardData {
  role: "teacher";
  activeSemester?: SemesterSummary | null;
  courseCount: number;
  totalRegisteredStudents: number;
  courses: TeacherDashboardCourseSummary[];
}

export type DashboardData = AdminDashboardData | StudentDashboardData | TeacherDashboardData;

export interface TeacherSummary {
  _id?: string;
  teacherId?: string;
  fullName?: string;
}

export interface SemesterSummary {
  _id?: string;
  semesterId?: string;
  name?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  registrationStart?: string;
  registrationEnd?: string;
}

export interface StudentSummary {
  _id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  role?: string;
  phone?: string;
  department?: string;
  academicYear?: string;
}

export type MaybePopulated<T> = string | T;

export interface StudentRecord {
  _id: string;
  userId?: string;
  fullName?: string;
  email: string;
  phone?: string;
  department?: string;
  academicYear?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherRecord {
  _id: string;
  teacherId: string;
  fullName: string;
  department?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseRecord {
  _id: string;
  courseId: string;
  name: string;
  credits: number;
  price?: number;
  department?: string;
  description?: string;
  teacherId: MaybePopulated<TeacherSummary>;
  semesterId: MaybePopulated<SemesterSummary>;
  schedule?: {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    room?: string;
  };
  maxStudents: number;
  currentStudents: number;
  status: "open" | "planned" | "ongoing" | "closed" | "full";
  openedAt?: string;
  qualifiedAt?: string;
  fullAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationRecord {
  _id: string;
  studentId: MaybePopulated<StudentSummary>;
  courseId: MaybePopulated<CourseRecord>;
  semesterId: MaybePopulated<SemesterSummary>;
  status: "registered" | "cancelled";
  cancelledAt?: string;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseRosterResponse {
  course: CourseRecord;
  registrations: RegistrationRecord[];
  total: number;
}