"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, GraduationCap, BookOpen } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber, formatScheduleText, formatStatusLabel } from "@/lib/format";
import { ensureArray } from "@/lib/utils";
import type { CourseRecord, StudentRecord, TeacherRecord } from "@/lib/types";

function includesQuery(value: unknown, query: string) {
  return String(value ?? "").toLowerCase().includes(query);
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [studentResponse, teacherResponse, courseResponse] = await Promise.all([
          apiFetch<StudentRecord[]>("/users?page=1&limit=500"),
          apiFetch<TeacherRecord[]>("/teachers?page=1&limit=500"),
          apiFetch<CourseRecord[]>("/courses?page=1&limit=500"),
        ]);

        if (cancelled) {
          return;
        }

        setStudents(ensureArray<StudentRecord>(studentResponse.data).filter((student) => (student.role ?? "student") === "student"));
        setTeachers(ensureArray<TeacherRecord>(teacherResponse.data));
        setCourses(ensureArray<CourseRecord>(courseResponse.data));
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Không tải được dữ liệu tìm kiếm");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        !normalizedQuery
          ? true
          : [student.userId, student.fullName, student.email, student.phone, student.department, student.academicYear].some((value) => includesQuery(value, normalizedQuery)),
      ),
    [normalizedQuery, students],
  );

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) =>
        !normalizedQuery
          ? true
          : [teacher.teacherId, teacher.fullName, teacher.department].some((value) => includesQuery(value, normalizedQuery)),
      ),
    [normalizedQuery, teachers],
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        !normalizedQuery
          ? true
          : [course.courseId, course.name, course.department, course.description, formatScheduleText(course.schedule), course.status].some((value) => includesQuery(value, normalizedQuery)),
      ),
    [courses, normalizedQuery],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Tra cứu</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Tìm kiếm</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tìm kiếm sinh viên, giảng viên và khóa học từ các API đã nạp.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sinh viên</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(filteredStudents.length)}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Giảng viên</p>
              <p className="mt-1 text-xl font-semibold text-primary">{formatNumber(filteredTeachers.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Khóa học</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{formatNumber(filteredCourses.length)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-3">
          <label className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mã, email, khoa hoặc lịch học"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">{error}</div> : null}

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Users className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-foreground">Sinh viên</h2>
        </div>
        <ResourceTable
          loading={loading}
          rows={filteredStudents.slice(0, 8)}
          rowKey={(student) => student._id}
          emptyMessage="Không tìm thấy sinh viên phù hợp."
          columns={[
            { header: "Tên", render: (student) => student.fullName || "-" },
            { header: "Email", render: (student) => student.email },
            { header: "Khoa", render: (student) => student.department || "-" },
            { header: "Niên khóa", render: (student) => student.academicYear || "-" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <GraduationCap className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-foreground">Giảng viên</h2>
        </div>
        <ResourceTable
          loading={loading}
          rows={filteredTeachers.slice(0, 8)}
          rowKey={(teacher) => teacher._id}
          emptyMessage="Không tìm thấy giảng viên phù hợp."
          columns={[
            { header: "Mã GV", render: (teacher) => teacher.teacherId },
            { header: "Họ tên", render: (teacher) => teacher.fullName },
            { header: "Khoa", render: (teacher) => teacher.department || "-" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <BookOpen className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-foreground">Khóa học</h2>
        </div>
        <ResourceTable
          loading={loading}
          rows={filteredCourses.slice(0, 8)}
          rowKey={(course) => course._id}
          emptyMessage="Không tìm thấy khóa học phù hợp."
          columns={[
            { header: "Mã học phần", render: (course) => course.courseId },
            { header: "Name", render: (course) => course.name },
            { header: "Lịch học", render: (course) => formatScheduleText(course.schedule) },
            { header: "Trạng thái", render: (course) => formatStatusLabel(course.status) },
          ]}
        />
      </section>
    </div>
  );
}