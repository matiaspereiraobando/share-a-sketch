"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  STROKE_ALPHA,
  STROKE_WIDTHS,
} from "@/lib/constants";
import type { Palette } from "@/lib/palettes";
import type { StoredStroke } from "@/lib/db/schema";

type DrawProps = {
  mode: "draw";
  palette: Palette;
  strokes: StoredStroke[];
  colorIndex: number;
  widthIndex: number;
  maxPoints: number;
  onStrokeCommit: (stroke: StoredStroke) => void;
  /**
   * Reports the point count of the current in-progress stroke only.
   * The parent owns the committed strokes and derives the total itself,
   * so undo/reset don't desync and the count doesn't flicker on stroke end.
   */
  onInProgressPointCountChange?: (count: number) => void;
};

type ViewProps = {
  mode: "view";
  palette: Palette;
  strokes: StoredStroke[];
  /** Number of strokes (including a possibly partial last stroke) to render. */
  replayStrokesShown: number;
  /** Number of points to render in the last partially-drawn stroke. */
  replayPartialPoints: number;
};

export type EtchCanvasProps = DrawProps | ViewProps;

const DISPLAY_SCALE = 2;
const DISPLAY_MAX_WIDTH = CANVAS_WIDTH * DISPLAY_SCALE;

function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: StoredStroke[],
  palette: Palette,
  upToStrokeCount: number,
  partialPointsInLast: number,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const limit = Math.min(upToStrokeCount, strokes.length);
  const lastIdx = limit - 1;

  for (let i = 0; i < limit; i++) {
    const s = strokes[i];
    const color = palette.colors[s.c] ?? "#000000";
    const width = STROKE_WIDTHS[s.w] ?? STROKE_WIDTHS[0];
    const pts = s.p;
    const pointPairs = pts.length / 2;

    let usedPairs = pointPairs;
    if (i === lastIdx) {
      usedPairs = Math.min(pointPairs, Math.max(0, partialPointsInLast));
    }
    if (usedPairs <= 0) continue;

    ctx.globalAlpha = STROKE_ALPHA;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    if (usedPairs === 1) {
      ctx.beginPath();
      ctx.arc(pts[0], pts[1], width / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let p = 1; p < usedPairs; p++) {
      ctx.lineTo(pts[p * 2], pts[p * 2 + 1]);
    }
    ctx.stroke();
  }

  ctx.restore();
}

export function EtchCanvas(props: EtchCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const liveStrokeRef = useRef<StoredStroke | null>(null);
    const activePointerIdRef = useRef<number | null>(null);
    const [redrawTick, setRedrawTick] = useState(0);
    const bumpRedraw = useCallback(() => setRedrawTick((v) => v + 1), []);

    const committedPointCount = props.strokes.reduce(
      (acc, s) => acc + s.p.length / 2,
      0,
    );

    const onInProgressPointCountChange =
      props.mode === "draw" ? props.onInProgressPointCountChange : undefined;

    const reportInProgress = useCallback(() => {
      if (!onInProgressPointCountChange) return;
      const inProgress = liveStrokeRef.current
        ? liveStrokeRef.current.p.length / 2
        : 0;
      onInProgressPointCountChange(inProgress);
    }, [onInProgressPointCountChange]);

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (props.mode === "view") {
        drawStrokes(
          ctx,
          props.strokes,
          props.palette,
          props.replayStrokesShown,
          props.replayPartialPoints,
        );
        return;
      }

      drawStrokes(
        ctx,
        props.strokes,
        props.palette,
        props.strokes.length,
        Number.MAX_SAFE_INTEGER,
      );

      const live = liveStrokeRef.current;
      if (live && live.p.length >= 2) {
        drawStrokes(
          ctx,
          [live],
          props.palette,
          1,
          Number.MAX_SAFE_INTEGER,
        );
      }
    }, [props, redrawTick]);

    useEffect(() => {
      if (props.mode !== "draw") {
        liveStrokeRef.current = null;
        activePointerIdRef.current = null;
      }
    }, [props.mode]);

    const toLogicalCoords = useCallback(
      (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
        const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
        return {
          x: Math.max(0, Math.min(CANVAS_WIDTH, Math.round(x))),
          y: Math.max(0, Math.min(CANVAS_HEIGHT, Math.round(y))),
        };
      },
      [],
    );

    const finishStroke = useCallback(() => {
      if (props.mode !== "draw") return;
      const live = liveStrokeRef.current;
      activePointerIdRef.current = null;
      liveStrokeRef.current = null;
      if (live && live.p.length >= 2) {
        props.onStrokeCommit(live);
      }
      bumpRedraw();
      reportInProgress();
    }, [props, bumpRedraw, reportInProgress]);

    const handlePointerDown = useCallback(
      (e: ReactPointerEvent<HTMLCanvasElement>) => {
        if (props.mode !== "draw") return;
        if (activePointerIdRef.current !== null) return;
        if (committedPointCount >= props.maxPoints) return;

        const coords = toLogicalCoords(e.clientX, e.clientY);
        if (!coords) return;

        activePointerIdRef.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}

        liveStrokeRef.current = {
          c: props.colorIndex,
          w: props.widthIndex,
          p: [coords.x, coords.y],
        };
        bumpRedraw();
        reportInProgress();
      },
      [
        props,
        committedPointCount,
        toLogicalCoords,
        bumpRedraw,
        reportInProgress,
      ],
    );

    const handlePointerMove = useCallback(
      (e: ReactPointerEvent<HTMLCanvasElement>) => {
        if (props.mode !== "draw") return;
        if (activePointerIdRef.current !== e.pointerId) return;
        const live = liveStrokeRef.current;
        if (!live) return;

        const coords = toLogicalCoords(e.clientX, e.clientY);
        if (!coords) return;

        const lastX = live.p[live.p.length - 2];
        const lastY = live.p[live.p.length - 1];
        if (coords.x === lastX && coords.y === lastY) return;

        const totalAfter = committedPointCount + live.p.length / 2 + 1;
        if (totalAfter > props.maxPoints) {
          finishStroke();
          return;
        }

        live.p.push(coords.x, coords.y);
        bumpRedraw();
        reportInProgress();

        if (totalAfter === props.maxPoints) {
          finishStroke();
        }
      },
      [
        props,
        committedPointCount,
        toLogicalCoords,
        finishStroke,
        bumpRedraw,
        reportInProgress,
      ],
    );

    const handlePointerUp = useCallback(
      (e: ReactPointerEvent<HTMLCanvasElement>) => {
        if (props.mode !== "draw") return;
        if (activePointerIdRef.current !== e.pointerId) return;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        finishStroke();
      },
      [props, finishStroke],
    );

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: DISPLAY_MAX_WIDTH,
          maxWidth: "100%",
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          height: "auto",
          background: "var(--canvas-bg)",
          imageRendering: "pixelated",
          touchAction: "none",
          cursor: props.mode === "draw" ? "crosshair" : "default",
          display: "block",
        }}
      />
    );
}
