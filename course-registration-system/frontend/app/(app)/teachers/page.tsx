"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Building2 } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { TeacherRecord } from "@/lib/types";

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<TeacherRecord[]>("/teachers?page=1&limit=500");
        if (cancelled) {
          return;
        }

        setTeachers(response.data ?? []);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load teachers");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeachers();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const departments = new Set(teachers.map((teacher) => teacher.department).filter(Boolean));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Faculty</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Teachers</h1>
            <p className="mt-2 text-sm text-slate-500">View teaching staff records loaded from the backend teachers API.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Teachers</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(teachers.length)}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-indigo-700">Departments</p>
              <p className="mt-1 text-xl font-semibold text-indigo-800">{formatNumber(departments.size)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Coverage</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">Live</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={teachers}
        rowKey={(teacher) => teacher._id}
        emptyMessage="No teachers found."
        columns={[
          {
            header: "Teacher ID",
            render: (teacher) => (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <GraduationCap className="mr-1 h-3.5 w-3.5" />
                {teacher.teacherId}
              </span>
            ),
          },
          {
            header: "Name",
            render: (teacher) => <p className="font-medium text-slate-900">{teacher.fullName}</p>,
          },
          {
            header: "Department",
            render: (teacher) => (
              <div className="inline-flex items-center gap-2 text-slate-700">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>{teacher.department || "-"}</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}