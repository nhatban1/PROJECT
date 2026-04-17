"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Phone } from "lucide-react";

import { ResourceTable } from "@/components/app/ResourceTable";
import { ApiError, apiFetch, clearAuthToken } from "@/lib/api";
import { formatNumber, formatStatusLabel } from "@/lib/format";
import type { StudentRecord } from "@/lib/types";

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch<StudentRecord[]>("/users?page=1&limit=500");
        if (cancelled) {
          return;
        }

        const records = (response.data ?? []).filter((student) => (student.role ?? "student") === "student");
        setStudents(records);
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError instanceof ApiError && fetchError.status === 401) {
          clearAuthToken();
          router.replace("/login");
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load students");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Directory</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Students</h1>
            <p className="mt-2 text-sm text-slate-500">Browse student accounts pulled from the backend users API.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Listed</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatNumber(students.length)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Visible</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{formatNumber(students.filter((student) => student.fullName).length)}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-indigo-700">With email</p>
              <p className="mt-1 text-xl font-semibold text-indigo-800">{formatNumber(students.filter((student) => student.email).length)}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">Role</p>
              <p className="mt-1 text-xl font-semibold text-amber-800">{formatStatusLabel("student")}</p>
            </div>
          </div>
        </div>
      </section>

      <ResourceTable
        loading={loading}
        error={error}
        rows={students}
        rowKey={(student) => student._id}
        emptyMessage="No student records found."
        columns={[
          {
            header: "Student",
            render: (student) => (
              <div className="space-y-1">
                <p className="font-medium text-slate-900">{student.fullName || "Unnamed student"}</p>
                <p className="text-xs text-slate-500">{student.userId || student._id}</p>
              </div>
            ),
          },
          {
            header: "Email",
            render: (student) => (
              <div className="inline-flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{student.email}</span>
              </div>
            ),
          },
          {
            header: "Phone",
            render: (student) => (
              <div className="inline-flex items-center gap-2 text-slate-700">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{student.phone || "-"}</span>
              </div>
            ),
          },
          {
            header: "Department",
            render: (student) => student.department || "-",
          },
          {
            header: "Academic year",
            render: (student) => student.academicYear || "-",
          },
          {
            header: "Role",
            render: () => (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Users className="mr-1 h-3.5 w-3.5" />
                Student
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}