"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
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

export type EtchCanvasHandle = {
  /** Number of points across all committed strokes + the in-progress stroke. */
  getLivePointCount: () => number;
};

type DrawProps = {
  mode: "draw";
  palette: Palette;
  strokes: StoredStroke[];
  colorIndex: number;
  widthIndex: number;
  maxPoints: number;
  onStrokeCommit: (stroke: StoredStroke) => void;
  onLivePointCountChange?: (count: number) => void;
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

export const EtchCanvas = forwardRef<EtchCanvasHandle, EtchCanvasProps>(
  function EtchCanvas(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const liveStrokeRef = useRef<StoredStroke | null>(null);
    const activePointerIdRef = useRef<number | null>(null);
    const [redrawTick, setRedrawTick] = useState(0);
    const bumpRedraw = useCallback(() => setRedrawTick((v) => v + 1), []);

    const committedPointCount = props.strokes.reduce(
      (acc, s) => acc + s.p.length / 2,
      0,
    );

    const onLivePointCountChange =
      props.mode === "draw" ? props.onLivePointCountChange : undefined;

    const reportLive = useCallback(() => {
      if (!onLivePointCountChange) return;
      const inProgress = liveStrokeRef.current
        ? liveStrokeRef.current.p.length / 2
        : 0;
      onLivePointCountChange(committedPointCount + inProgress);
    }, [onLivePointCountChange, committedPointCount]);

    useImperativeHandle(ref, () => ({
      getLivePointCount: () => {
        const inProgress = liveStrokeRef.current
          ? liveStrokeRef.current.p.length / 2
          : 0;
        return committedPointCount + inProgress;
      },
    }));

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
      reportLive();
    }, [props, bumpRedraw, reportLive]);

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
        reportLive();
      },
      [
        props,
        committedPointCount,
        toLogicalCoords,
        bumpRedraw,
        reportLive,
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
        reportLive();

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
        reportLive,
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
          width: CANVAS_WIDTH * DISPLAY_SCALE,
          height: CANVAS_HEIGHT * DISPLAY_SCALE,
          background: "var(--canvas-bg)",
          imageRendering: "pixelated",
          touchAction: "none",
          cursor: props.mode === "draw" ? "crosshair" : "default",
          display: "block",
        }}
      />
    );
  },
);
