import type {
  AdminDrawingDTO,
  AdminDrawingListResponse,
  AdminStatsDTO,
  AdminVote,
  DrawingStatus,
} from "@/lib/types";

export type AdminApiErrorBody = {
  error: string;
  code?: string;
};

export class AdminApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined" && !path.endsWith("/auth/login")) {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/admin/login?next=${encodeURIComponent(next)}`;
    }
    throw new AdminApiError("Unauthorized", 401, "unauthorized");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as AdminApiErrorBody;
      if (body?.error) message = body.error;
      if (body?.code) code = body.code;
    } catch {}
    throw new AdminApiError(message, res.status, code);
  }

  return (await res.json()) as T;
}

export type AdminListQuery = {
  status?: "all" | "active" | "hidden";
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "created_desc" | "flags_desc" | "thumbs_desc";
};

function buildQuery(query: AdminListQuery): string {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.sort) params.set("sort", query.sort);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  login(password: string) {
    return request<{ ok: true }>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },
  logout() {
    return request<{ ok: true }>("/api/admin/auth/logout", { method: "POST" });
  },
  listDrawings(query: AdminListQuery = {}) {
    return request<AdminDrawingListResponse>(
      `/api/admin/drawings${buildQuery(query)}`,
    );
  },
  getDrawing(id: string) {
    return request<{ drawing: AdminDrawingDTO }>(
      `/api/admin/drawings/${encodeURIComponent(id)}`,
    );
  },
  setStatus(id: string, status: DrawingStatus) {
    return request<{ drawing: AdminDrawingDTO }>(
      `/api/admin/drawings/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
  },
  getVotes(id: string) {
    return request<{ votes: AdminVote[] }>(
      `/api/admin/drawings/${encodeURIComponent(id)}/votes`,
    );
  },
  getStats() {
    return request<AdminStatsDTO>("/api/admin/stats");
  },
};
