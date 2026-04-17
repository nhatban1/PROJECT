"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
      <div className="grid md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.24),_transparent_38%),linear-gradient(135deg,_#0f172a_0%,_#1e293b_55%,_#334155_100%)] p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%,rgba(255,255,255,0.05)_70%,transparent)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
              <BrandLogo size="md" tone="inverse" />
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300/90">Truy cập an toàn</p>
              <h1 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
                Quản lý học kỳ, khóa học và đăng ký trên một hệ thống duy nhất.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-200/90 sm:text-lg">
                Đăng nhập để tiếp tục vào bảng điều khiển học vụ và xử lý luồng công việc sinh viên mà không cần chuyển công cụ.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-200/90 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                Đăng nhập nhanh
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                Phân quyền theo vai trò
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                Sẵn sàng cho bảng điều khiển
              </div>
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10 lg:p-12">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Chào mừng trở lại</h2>
            <p className="text-sm text-muted-foreground">Nhập tài khoản của bạn để tiếp tục.</p>
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
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="admin@iuh-eduhub.vn"
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
                  className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
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
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
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

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bạn cần tài khoản? Hãy liên hệ quản trị viên.
          </p>
        </section>
      </div>
    </div>
  );
}