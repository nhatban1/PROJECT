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
      <div className="min-h-screen flex flex-col bg-background text-foreground pl-64">
        <Sidebar />
        <Navbar />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}