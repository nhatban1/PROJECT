"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/layout/AuthProvider";
import { getInitials } from "@/lib/format";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Basic Breadcrumb mapping
  const segments = pathname.split("/").filter(Boolean);
  const title = segments[segments.length - 1] || "Dashboard";
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
  const displayName = user?.fullName ?? user?.email ?? "Admin User";
  const displayEmail = user?.email ?? "admin@eduhub.com";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-slate-800">{formattedTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </Button>

        <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {getInitials(displayName)}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500">{displayEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}