import { getAnonId } from "@/lib/anonId";
import { ANON_ID_HEADER } from "@/lib/api";
import type { DrawingDTO, StatsDTO, StoredStroke } from "@/lib/types";

export type ApiErrorResponse = {
  error: string;
  code?: string;
  status: number;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const anonId = getAnonId();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      [ANON_ID_HEADER]: anonId,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string; code?: string };
      if (body?.error) message = body.error;
      if (body?.code) code = body.code;
    } catch {}
    throw new ApiError(message, res.status, code);
  }
  return (await res.json()) as T;
}

export type SubmitDrawingBody = {
  paletteId: string;
  authorName: string;
  strokes: StoredStroke[];
  pointCount: number;
};

export type SubmitDrawingResponse = {
  saved: { id: string };
  next: DrawingDTO | null;
};

export type RandomResponse = {
  drawing: DrawingDTO | null;
};

export type DrawingResponse = {
  drawing: DrawingDTO;
};

export type VoteResponse = {
  thumbsUp: number;
  flagCount: number;
  hidden: boolean;
  alreadyVoted: boolean;
};

export type StatsResponse = StatsDTO;

export const api = {
  submitDrawing(body: SubmitDrawingBody) {
    return request<SubmitDrawingResponse>("/api/drawings", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  getRandom(excludeId?: string | null) {
    const qs = excludeId
      ? `?excludeId=${encodeURIComponent(excludeId)}`
      : "";
    return request<RandomResponse>(`/api/drawings/random${qs}`);
  },
  getDrawing(id: string) {
    return request<DrawingResponse>(`/api/drawings/${encodeURIComponent(id)}`);
  },
  vote(id: string, type: "thumb" | "flag") {
    return request<VoteResponse>(
      `/api/drawings/${encodeURIComponent(id)}/vote`,
      {
        method: "POST",
        body: JSON.stringify({ type }),
      },
    );
  },
  getStats() {
    return request<StatsResponse>("/api/stats");
  },
};
