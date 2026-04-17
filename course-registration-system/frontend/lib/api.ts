import type { ApiResponse } from "@/lib/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  payload: ApiResponse<unknown> | null;

  constructor(message: string, status: number, payload: ApiResponse<unknown> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("token");
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("token");
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("token", token);
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const body = await response.text();

  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = await parseResponse<T>(response);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `Yêu cầu thất bại với mã trạng thái ${response.status}`, response.status, payload);
  }

  return payload ?? { success: true };
}