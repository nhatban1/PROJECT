"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/layout/AuthProvider";
import { BrandLogo } from "@/components/layout/BrandLogo";
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
    { name: "Bảng điều khiển", path: "/dashboard", icon: LayoutDashboard },
    { name: "Sinh viên", path: "/students", icon: Users },
    { name: "Giảng viên", path: "/teachers", icon: GraduationCap },
    { name: "Khóa học", path: "/courses", icon: BookOpen },
    { name: "Đăng ký học phần", path: "/registration", icon: CalendarDays },
    { name: "Tìm kiếm", path: "/search", icon: Search },
    { name: "Báo cáo", path: "/reports", icon: FileBarChart },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card text-foreground">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" aria-label="IUH-EduHub - Bảng điều khiển">
          <BrandLogo size="sm" />
        </Link>
      </div>

      <div className="flex h-[calc(100vh-4rem)] flex-col justify-between p-4">
        <nav className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.path || pathname.startsWith(`${route.path}/`);
            return (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}