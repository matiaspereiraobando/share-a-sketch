import { useEffect, useMemo, useRef, useState } from "react";
import { REPLAY_POINTS_PER_SECOND } from "@/lib/constants";
import type { StoredStroke } from "@/lib/db/schema";

export type ReplayState = {
  replayStrokesShown: number;
  replayPartialPoints: number;
  pointsShown: number;
  totalPoints: number;
  done: boolean;
};

export function computeReplayFrame(
  strokes: StoredStroke[],
  pointsShown: number,
): { replayStrokesShown: number; replayPartialPoints: number } {
  if (pointsShown <= 0) {
    return { replayStrokesShown: 0, replayPartialPoints: 0 };
  }
  let remaining = pointsShown;
  for (let i = 0; i < strokes.length; i++) {
    const pairs = strokes[i].p.length / 2;
    if (remaining <= pairs) {
      return { replayStrokesShown: i + 1, replayPartialPoints: remaining };
    }
    remaining -= pairs;
  }
  return {
    replayStrokesShown: strokes.length,
    replayPartialPoints: Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Time-based replay loop. Uses elapsed wall-clock time × points-per-second
 * so it looks the same on every device regardless of frame rate.
 */
export function useReplay(strokes: StoredStroke[]): ReplayState {
  const totalPoints = useMemo(
    () => strokes.reduce((acc, s) => acc + s.p.length / 2, 0),
    [strokes],
  );

  const [pointsShown, setPointsShown] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setPointsShown(0);
    startedAtRef.current = null;

    if (totalPoints === 0) return;

    const tick = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now;
      const elapsedSeconds = (now - startedAtRef.current) / 1000;
      const shown = Math.min(
        totalPoints,
        Math.floor(elapsedSeconds * REPLAY_POINTS_PER_SECOND),
      );
      setPointsShown(shown);
      if (shown < totalPoints) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [strokes, totalPoints]);

  const frame = computeReplayFrame(strokes, pointsShown);
  return {
    ...frame,
    pointsShown,
    totalPoints,
    done: totalPoints > 0 && pointsShown >= totalPoints,
  };
}
