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
};

/**
 * Aggregate, game-wide stats over the active (non-hidden) sketch pool.
 */
export type StatsDTO = {
  totalDrawings: number;
  totalInk: number;
  uniqueCreators: number;
};
