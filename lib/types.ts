import type { StoredDrawing, StoredStroke } from "@/lib/db/schema";

export type { StoredDrawing, StoredStroke };

/**
 * Public DTO returned by the API when serving a sketch to view.
 */
export type DrawingDTO = {
  id: string;
  authorName: string;
  paletteId: string;
  strokes: StoredStroke[];
  thumbsUp: number;
  flagCount: number;
  pointCount: number;
  createdAt: string;
  /** Daily prompt the creator opted into, or null for free draw. */
  promptText: string | null;
};

/**
 * Aggregate, game-wide stats over the active (non-hidden) sketch pool.
 */
export type StatsDTO = {
  totalDrawings: number;
  totalInk: number;
  uniqueCreators: number;
};

export type DrawingStatus = "active" | "hidden";

/**
 * Row shown in the admin drawings table. Strokes are not included to keep
 * list payloads small; the detail endpoint returns the full sketch.
 */
export type AdminDrawingSummary = {
  id: string;
  authorName: string;
  paletteId: string;
  pointCount: number;
  thumbsUp: number;
  flagCount: number;
  status: DrawingStatus;
  createdAt: string;
  promptText: string | null;
  creatorAnonId: string;
};

/**
 * Full admin view of a sketch, including hidden ones.
 */
export type AdminDrawingDTO = DrawingDTO & {
  status: DrawingStatus;
  creatorAnonId: string;
};

export type AdminDrawingListResponse = {
  items: AdminDrawingSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminVote = {
  type: "thumb" | "flag";
  createdAt: string;
  anonIdPreview: string;
};

export type AdminStatsDTO = {
  totalDrawings: number;
  activeDrawings: number;
  hiddenDrawings: number;
  totalInk: number;
  uniqueCreators: number;
  totalVotes: number;
  totalThumbs: number;
  totalFlags: number;
  submissionsLast7Days: { date: string; count: number }[];
};
