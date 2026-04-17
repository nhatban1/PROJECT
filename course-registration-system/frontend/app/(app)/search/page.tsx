"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, GraduationCap, BookOpen } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber, formatScheduleText, formatStatusLabel } from "@/lib/format";
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

        setStudents((studentResponse.data ?? []).filter((student) => (student.role ?? "student") === "student"));
        setTeachers(teacherResponse.data ?? []);
        setCourses(courseResponse.data ?? []);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load search data");
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
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Finder</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Search</h1>
            <p className="mt-2 text-sm text-slate-500">Search across students, teachers, and courses from the loaded APIs.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Students</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(filteredStudents.length)}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-indigo-700">Teachers</p>
              <p className="mt-1 text-xl font-semibold text-indigo-800">{formatNumber(filteredTeachers.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Courses</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{formatNumber(filteredCourses.length)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="flex items-center gap-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, code, email, department, or schedule"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Users className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-slate-900">Students</h2>
        </div>
        <ResourceTable
          loading={loading}
          rows={filteredStudents.slice(0, 8)}
          rowKey={(student) => student._id}
          emptyMessage="No matching students found."
          columns={[
            { header: "Name", render: (student) => student.fullName || "-" },
            { header: "Email", render: (student) => student.email },
            { header: "Department", render: (student) => student.department || "-" },
            { header: "Academic year", render: (student) => student.academicYear || "-" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <GraduationCap className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-slate-900">Teachers</h2>
        </div>
        <ResourceTable
          loading={loading}
          rows={filteredTeachers.slice(0, 8)}
          rowKey={(teacher) => teacher._id}
          emptyMessage="No matching teachers found."
          columns={[
            { header: "Teacher ID", render: (teacher) => teacher.teacherId },
            { header: "Name", render: (teacher) => teacher.fullName },
            { header: "Department", render: (teacher) => teacher.department || "-" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <BookOpen className="h-4 w-4" />
          <h2 className="text-lg font-semibold text-slate-900">Courses</h2>
        </div>
        <ResourceTable
          loading={loading}
          rows={filteredCourses.slice(0, 8)}
          rowKey={(course) => course._id}
          emptyMessage="No matching courses found."
          columns={[
            { header: "Code", render: (course) => course.courseId },
            { header: "Name", render: (course) => course.name },
            { header: "Schedule", render: (course) => formatScheduleText(course.schedule) },
            { header: "Status", render: (course) => formatStatusLabel(course.status) },
          ]}
        />
      </section>
    </div>
  );
}