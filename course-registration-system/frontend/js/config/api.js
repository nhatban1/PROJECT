const API_BASE = "http://localhost:5000/api";

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + url, {
    ...options,
    headers
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "API error");
  }
  return res.json();
}