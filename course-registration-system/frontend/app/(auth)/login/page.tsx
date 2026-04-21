"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Eye, EyeOff, Lock, Mail, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Đang tải trang đăng nhập...
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? "Đăng nhập thất bại");
      }

      const token = payload?.data?.token;
      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      window.localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Đã xảy ra lỗi khi đăng nhập");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[linear-gradient(to_bottom_right,#a3bbed_0%,#ffffff_50%,#e4d4f4_100%)] dark:bg-[linear-gradient(to_bottom_right,#1e293b_0%,#0f172a_100%)] text-foreground">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex justify-center">
          <div className="w-full rounded-[2rem] border border-white/70 bg-white/80 dark:bg-[#161b22]/90 dark:border-white/10 px-6 py-4 shadow-[0_16px_50px_rgba(15,23,42,0.14)] backdrop-blur">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              <Image src="/iuh-eduhub-logo.svg" alt="IUH EduHub" width={320} height={88} priority className="h-16 w-auto sm:h-20" />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-400">Industrial University of Ho Chi Minh City</p>
                <p className="text-sm text-muted-foreground dark:text-slate-200">Cổng đăng nhập hệ thống đăng ký học phần và quản lý lớp học.</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-2">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 dark:bg-[#161b22]/90 dark:border-white/10 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-lg">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#2563eb_100%)] p-8 text-white sm:p-10 lg:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_40%,rgba(255,255,255,0.06)_72%,transparent)]" />
                <div className="relative flex h-full flex-col justify-between gap-10">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">IUH-EduHub - Hệ thống quản lý môn học chuyên nghiệp!</h3>
                      <p className="max-w-lg text-sm leading-7 text-sky-50/90 sm:text-base">
                        Hãy đăng nhập ngay để xem môn học, chọn lớp và đăng ký các học phần đang mở.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                      <BookOpen className="h-5 w-5 text-sky-100" />
                      <p className="mt-3 text-sm font-semibold">Đăng ký môn học</p>
                      <p className="mt-1 text-xs leading-6 text-sky-50/80">Xem môn học và đăng ký lớp phù hợp.</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                      <CalendarDays className="h-5 w-5 text-sky-100" />
                      <p className="mt-3 text-sm font-semibold">Xem lịch học</p>
                      <p className="mt-1 text-xs leading-6 text-sky-50/80">Theo dõi buổi học và thời gian học.</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                      <Users className="h-5 w-5 text-sky-100" />
                      <p className="mt-3 text-sm font-semibold">Tra cứu lớp</p>
                      <p className="mt-1 text-xs leading-6 text-sky-50/80">Xem sĩ số và thông tin lớp học.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-8 sm:p-10 lg:p-12">
                <div className="mb-8 space-y-3">
                  <p className="inline-flex w-fit items-center rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300">
                    Đăng nhập hệ thống
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">Chào mừng trở lại</h2>
                  <p className="text-sm leading-6 text-muted-foreground">Nhập email và mật khẩu để tiếp tục.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11 w-full rounded-xl border border-input bg-background dark:bg-[#1a1f2e] dark:border-white/10 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        placeholder="Admin@iuh.edu.vn"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-11 w-full rounded-xl border border-input bg-background dark:bg-[#1a1f2e] dark:border-white/10 pl-10 pr-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                        placeholder="Nhập mật khẩu của bạn"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 rounded border-input dark:border-white/20 dark:bg-transparent text-primary focus:ring-primary" />
                      Ghi nhớ tôi
                    </label>
                    <button type="button" className="font-medium text-primary transition hover:text-primary/80">
                      Quên mật khẩu?
                    </button>
                  </div>

                  <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold" disabled={loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">Bạn cần tạo tài khoản? Hãy liên hệ với quản trị viên.</p>
              </section>
            </div>
          </div>
        </main>

        <footer className="relative mt-6 overflow-hidden rounded-[0.5rem] border border-white/20 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#2563eb_100%)] text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_40%,rgba(255,255,255,0.06)_72%,transparent)]" />
          <div className="relative grid gap-px lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              <p className="text-[15px] font-semibold uppercase tracking-wide dark:text-[#FFD700]">TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP TP HỒ CHÍ MINH</p>
              <div className="mt-2 space-y-1 text-sm leading-6 text-white/95">
                <p>Địa chỉ : Số 12 Nguyễn Văn Bảo, Phường Hạnh Thông, TP. Hồ Chí Minh (Trụ sở chính)</p>
                <p>Điện thoại: 0283 8940 390</p>
                <p>Fax: 0283 9940 954</p>
                <p>Email: dhcn@iuh.edu.vn</p>
              </div>
            </div>

            <div className="px-5 py-4 sm:px-6 sm:py-5 lg:text-right">
              <p className="text-[15px] font-semibold uppercase tracking-wide dark:text-[#FFD700]">Thống kê truy cập</p>
              <div className="mt-2 space-y-1 text-sm leading-6 text-white/95 lg:ml-auto lg:max-w-xs">
                <p>Lượt truy cập: Analyzing ...</p>
                <p>Đang online: Loading ...</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white/10 px-5 py-3 text-center text-sm font-medium text-white backdrop-blur sm:px-6 border-t border-white/10">
            {/* Họa tiết gợn sóng (wavy lines pattern) + hiệu ứng Hologram bóng mờ */}
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='8' viewBox='0 0 30 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'%3E%3Cpath d='M0 4q7.5 4 15 0t15 0'/%3E%3C/g%3E%3C/svg%3E")` }} />
            <div className="pointer-events-none absolute -inset-1/2 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-60 mix-blend-overlay rotate-12 blur-md" />
            <span className="relative z-10 dark:text-[#FFD700]">© 2026 Industrial University of Ho Chi Minh City - EduHub. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}