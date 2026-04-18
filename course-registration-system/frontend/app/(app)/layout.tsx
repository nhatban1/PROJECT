import { AuthProvider } from "@/components/layout/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[40rem] w-[40rem] -translate-y-1/4 -translate-x-1/4 rounded-full bg-[#93C5FD] opacity-40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[40rem] w-[40rem] translate-y-1/4 translate-x-1/4 rounded-full bg-[#D8B4FE] opacity-40 blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col text-foreground pl-64">
        <Sidebar />
        <Navbar />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}