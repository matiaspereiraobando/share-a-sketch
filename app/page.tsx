"use client";

import { useCallback, useRef, useState } from "react";
import { EtchCanvas, type EtchCanvasHandle } from "./components/EtchCanvas";
import { DEFAULT_PALETTE_ID, getPalette } from "@/lib/palettes";
import { MAX_POINTS } from "@/lib/constants";
import type { StoredStroke } from "@/lib/db/schema";

export default function HomePage() {
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [colorIndex, setColorIndex] = useState(0);
  const [widthIndex, setWidthIndex] = useState(1);
  const [strokes, setStrokes] = useState<StoredStroke[]>([]);
  const [livePointCount, setLivePointCount] = useState(0);
  const canvasRef = useRef<EtchCanvasHandle>(null);

  const palette = getPalette(paletteId);

  const handleStrokeCommit = useCallback((stroke: StoredStroke) => {
    setStrokes((prev) => [...prev, stroke]);
  }, []);

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleReset = useCallback(() => {
    setStrokes([]);
    setLivePointCount(0);
  }, []);

  const pct = Math.min(100, Math.round((livePointCount / MAX_POINTS) * 100));

  return (
    <main style={{ padding: 16 }}>
      <h1>Share-a-Sketch</h1>
      <EtchCanvas
        ref={canvasRef}
        mode="draw"
        palette={palette}
        strokes={strokes}
        colorIndex={colorIndex}
        widthIndex={widthIndex}
        maxPoints={MAX_POINTS}
        onStrokeCommit={handleStrokeCommit}
        onLivePointCountChange={setLivePointCount}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={handleUndo}>Undo</button>{" "}
        <button onClick={handleReset}>Reset</button>{" "}
        <span>
          Points: {livePointCount} / {MAX_POINTS} ({pct}%)
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11 }}>
        Palette: {palette.name} • Color idx: {colorIndex} • Width idx: {widthIndex}
      </div>
    </main>
  );
}
