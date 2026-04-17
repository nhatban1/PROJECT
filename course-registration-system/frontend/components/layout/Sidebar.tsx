"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/layout/AuthProvider";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarDays,
  Search,
  FileBarChart,
  LogOut
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  // Typically, these routes would be filtered by user role
  const routes = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Students", path: "/students", icon: Users },
    { name: "Teachers", path: "/teachers", icon: GraduationCap },
    { name: "Courses", path: "/courses", icon: BookOpen },
    { name: "Registration", path: "/registration", icon: CalendarDays },
    { name: "Search", path: "/search", icon: Search },
    { name: "Reports", path: "/reports", icon: FileBarChart },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
          <GraduationCap className="h-6 w-6" />
          <span>EduHub</span>
        </Link>
      </div>

      <div className="flex flex-col h-[calc(100vh-4rem)] justify-between p-4">
        <nav className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.path || pathname.startsWith(`${route.path}/`);
            return (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}