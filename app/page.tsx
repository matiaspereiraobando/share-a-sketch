"use client";

import { useCallback, useState } from "react";
import { EtchCanvas } from "./components/EtchCanvas";
import { EtchFrame } from "./components/EtchFrame";
import { Toolbar } from "./components/Toolbar";
import { Window95 } from "./components/Window95";
import { ShareDialog } from "./components/ShareDialog";
import { DEFAULT_PALETTE_ID, getPalette } from "@/lib/palettes";
import { MAX_POINTS } from "@/lib/constants";
import { api } from "@/lib/apiClient";
import type { StoredStroke } from "@/lib/db/schema";

type Mode = "draw" | "view";

export default function HomePage() {
  const [mode] = useState<Mode>("draw");
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [colorIndex, setColorIndex] = useState(0);
  const [widthIndex, setWidthIndex] = useState(1);
  const [strokes, setStrokes] = useState<StoredStroke[]>([]);
  const [livePointCount, setLivePointCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const palette = getPalette(paletteId);

  const hasContent = strokes.length > 0 || livePointCount > 0;

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

  const handlePaletteChange = useCallback((id: string) => {
    setPaletteId(id);
    setColorIndex(0);
    setStrokes([]);
    setLivePointCount(0);
  }, []);

  const handleShare = useCallback(
    async (name: string) => {
      setShareBusy(true);
      setShareError(null);
      try {
        const pointCount = strokes.reduce(
          (acc, s) => acc + s.p.length / 2,
          0,
        );
        const response = await api.submitDrawing({
          paletteId,
          authorName: name,
          strokes,
          pointCount,
        });
        setShareOpen(false);
        // TODO: in the replay todo, transition to viewing `response.next`.
        console.log("shared successfully", response);
      } catch (err) {
        setShareError(
          err instanceof Error ? err.message : "Failed to share",
        );
      } finally {
        setShareBusy(false);
      }
    },
    [paletteId, strokes],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Window95 title="Share-a-Sketch">
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <EtchFrame>
            <EtchCanvas
              mode="draw"
              palette={palette}
              strokes={strokes}
              colorIndex={colorIndex}
              widthIndex={widthIndex}
              maxPoints={MAX_POINTS}
              onStrokeCommit={handleStrokeCommit}
              onLivePointCountChange={setLivePointCount}
            />
          </EtchFrame>
          <div style={{ width: 260 }}>
            <Toolbar
              palette={palette}
              paletteId={paletteId}
              colorIndex={colorIndex}
              widthIndex={widthIndex}
              pointCount={livePointCount}
              maxPoints={MAX_POINTS}
              canUndo={strokes.length > 0}
              canReset={hasContent}
              canShare={mode === "draw" && strokes.length > 0}
              onPaletteChange={handlePaletteChange}
              onColorChange={setColorIndex}
              onWidthChange={setWidthIndex}
              onUndo={handleUndo}
              onReset={handleReset}
              onShare={() => {
                setShareError(null);
                setShareOpen(true);
              }}
            />
          </div>
        </div>
      </Window95>
      <ShareDialog
        open={shareOpen}
        busy={shareBusy}
        error={shareError}
        onCancel={() => setShareOpen(false)}
        onSubmit={handleShare}
      />
    </div>
  );
}
