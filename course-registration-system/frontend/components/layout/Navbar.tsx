"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/layout/AuthProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { getInitials } from "@/lib/format";

const routeTitles: Record<string, string> = {
  dashboard: "Bảng điều khiển",
  students: "Sinh viên",
  teachers: "Giảng viên",
  courses: "Khóa học",
  registration: "Đăng ký học phần",
  search: "Tìm kiếm",
  reports: "Báo cáo",
};

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const segments = pathname.split("/").filter(Boolean);
  const activeSection = segments[0] || "dashboard";
  const formattedTitle = routeTitles[activeSection] ?? "Bảng điều khiển";
  const displayName = user?.fullName ?? user?.email ?? "Quản trị viên";
  const displayEmail = user?.email ?? "admin@iuh-eduhub.vn";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">{formattedTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" aria-label="Thông báo" title="Thông báo">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background"></span>
        </Button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getInitials(displayName)}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}