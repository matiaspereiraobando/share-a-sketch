"use client";

import { useCallback, useMemo, useState } from "react";
import { EtchCanvas } from "./components/EtchCanvas";
import { EtchFrame } from "./components/EtchFrame";
import { Toolbar } from "./components/Toolbar";
import { Window95 } from "./components/Window95";
import { ShareDialog } from "./components/ShareDialog";
import { ViewerControls } from "./components/ViewerControls";
import { ShortIdChip } from "./components/ShortIdChip";
import { StatsBar } from "./components/StatsBar";
import { DEFAULT_PALETTE_ID, getPalette } from "@/lib/palettes";
import { MAX_POINTS } from "@/lib/constants";
import { api, ApiError } from "@/lib/apiClient";
import { useReplay } from "@/lib/replay";
import type { DrawingDTO, StoredStroke } from "@/lib/types";

type Mode =
  | { kind: "draw" }
  | {
      kind: "view";
      drawing: DrawingDTO;
      voted: "thumb" | "flag" | null;
      hidden: boolean;
    };

export default function HomePage() {
  const [mode, setMode] = useState<Mode>({ kind: "draw" });
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE_ID);
  const [colorIndex, setColorIndex] = useState(0);
  const [widthIndex, setWidthIndex] = useState(1);
  const [strokes, setStrokes] = useState<StoredStroke[]>([]);
  const [inProgressPointCount, setInProgressPointCount] = useState(0);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const [voteBusy, setVoteBusy] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const [statsKey, setStatsKey] = useState(0);

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
      <Window95
        title={
          mode.kind === "view"
            ? "Share-a-Sketch - Viewing a sketch"
            : "Share-a-Sketch"
        }
      >
        {mode.kind === "draw" ? (
          <DrawMode
            paletteId={paletteId}
            colorIndex={colorIndex}
            widthIndex={widthIndex}
            strokes={strokes}
            inProgressPointCount={inProgressPointCount}
            setStrokes={setStrokes}
            setInProgressPointCount={setInProgressPointCount}
            setPaletteId={setPaletteId}
            setColorIndex={setColorIndex}
            setWidthIndex={setWidthIndex}
            openShare={() => {
              setShareError(null);
              setShareOpen(true);
            }}
          />
        ) : (
          <ViewMode
            drawing={mode.drawing}
            voted={mode.voted}
            hidden={mode.hidden}
            voteBusy={voteBusy}
            loadingNext={loadingNext}
            error={viewerError}
            onThumb={async () => {
              if (mode.kind !== "view") return;
              setVoteBusy(true);
              setViewerError(null);
              try {
                const res = await api.vote(mode.drawing.id, "thumb");
                setMode({
                  kind: "view",
                  drawing: {
                    ...mode.drawing,
                    thumbsUp: res.thumbsUp,
                    flagCount: res.flagCount,
                  },
                  voted: "thumb",
                  hidden: res.hidden,
                });
              } catch (err) {
                setViewerError(
                  err instanceof Error ? err.message : "Failed to vote",
                );
              } finally {
                setVoteBusy(false);
              }
            }}
            onFlag={async () => {
              if (mode.kind !== "view") return;
              setVoteBusy(true);
              setViewerError(null);
              try {
                const res = await api.vote(mode.drawing.id, "flag");
                setMode({
                  kind: "view",
                  drawing: {
                    ...mode.drawing,
                    thumbsUp: res.thumbsUp,
                    flagCount: res.flagCount,
                  },
                  voted: "flag",
                  hidden: res.hidden,
                });
              } catch (err) {
                setViewerError(
                  err instanceof Error ? err.message : "Failed to flag",
                );
              } finally {
                setVoteBusy(false);
              }
            }}
            onNext={async () => {
              if (mode.kind !== "view") return;
              setLoadingNext(true);
              setViewerError(null);
              try {
                const res = await api.getRandom(mode.drawing.id);
                if (!res.drawing) {
                  setViewerError("No other sketches available yet.");
                } else {
                  setMode({
                    kind: "view",
                    drawing: res.drawing,
                    voted: null,
                    hidden: false,
                  });
                }
              } catch (err) {
                setViewerError(
                  err instanceof Error
                    ? err.message
                    : "Failed to load another",
                );
              } finally {
                setLoadingNext(false);
              }
            }}
            onNew={() => {
              setMode({ kind: "draw" });
              setStrokes([]);
              setInProgressPointCount(0);
              setViewerError(null);
            }}
          />
        )}
        <StatsBar refreshKey={statsKey} />
      </Window95>

      <ShareDialog
        open={shareOpen}
        busy={shareBusy}
        error={shareError}
        onCancel={() => setShareOpen(false)}
        onSubmit={async (name) => {
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
            setStatsKey((k) => k + 1);
            setShareOpen(false);
            if (response.next) {
              setMode({
                kind: "view",
                drawing: response.next,
                voted: null,
                hidden: false,
              });
              setStrokes([]);
              setInProgressPointCount(0);
            } else {
              setShareError(
                "Your sketch was saved! No other sketches to show yet. Draw another?",
              );
              setStrokes([]);
              setInProgressPointCount(0);
              setTimeout(() => setShareError(null), 4000);
            }
          } catch (err) {
            setShareError(
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Failed to share",
            );
          } finally {
            setShareBusy(false);
          }
        }}
      />
    </div>
  );
}

type DrawModeProps = {
  paletteId: string;
  colorIndex: number;
  widthIndex: number;
  strokes: StoredStroke[];
  inProgressPointCount: number;
  setStrokes: (
    update: StoredStroke[] | ((prev: StoredStroke[]) => StoredStroke[]),
  ) => void;
  setInProgressPointCount: (n: number) => void;
  setPaletteId: (id: string) => void;
  setColorIndex: (i: number) => void;
  setWidthIndex: (i: number) => void;
  openShare: () => void;
};

function DrawMode({
  paletteId,
  colorIndex,
  widthIndex,
  strokes,
  inProgressPointCount,
  setStrokes,
  setInProgressPointCount,
  setPaletteId,
  setColorIndex,
  setWidthIndex,
  openShare,
}: DrawModeProps) {
  const palette = getPalette(paletteId);

  const committedPointCount = useMemo(
    () => strokes.reduce((acc, s) => acc + s.p.length / 2, 0),
    [strokes],
  );
  const totalPointCount = committedPointCount + inProgressPointCount;
  const hasContent = strokes.length > 0 || inProgressPointCount > 0;

  const handleStrokeCommit = useCallback(
    (stroke: StoredStroke) => {
      setStrokes((prev) => [...prev, stroke]);
    },
    [setStrokes],
  );

  const handlePaletteChange = useCallback(
    (id: string) => {
      if (id === paletteId) return;
      if (strokes.length > 0) {
        const confirmed = window.confirm(
          "Changing the palette will clear your current sketch because each stroke's color is stored as an index into the active palette. Continue?",
        );
        if (!confirmed) return;
      }
      setPaletteId(id);
      setColorIndex(0);
      setStrokes([]);
      setInProgressPointCount(0);
    },
    [paletteId, strokes.length, setPaletteId, setColorIndex, setStrokes, setInProgressPointCount],
  );

  return (
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
          onInProgressPointCountChange={setInProgressPointCount}
        />
      </EtchFrame>
      <div style={{ width: 260 }}>
        <Toolbar
          palette={palette}
          paletteId={paletteId}
          colorIndex={colorIndex}
          widthIndex={widthIndex}
          pointCount={totalPointCount}
          maxPoints={MAX_POINTS}
          canUndo={strokes.length > 0}
          canReset={hasContent}
          canShare={strokes.length > 0}
          onPaletteChange={handlePaletteChange}
          onColorChange={setColorIndex}
          onWidthChange={setWidthIndex}
          onUndo={() => setStrokes((prev) => prev.slice(0, -1))}
          onReset={() => {
            setStrokes([]);
            setInProgressPointCount(0);
          }}
          onShare={openShare}
        />
      </div>
    </div>
  );
}

type ViewModeProps = {
  drawing: DrawingDTO;
  voted: "thumb" | "flag" | null;
  hidden: boolean;
  voteBusy: boolean;
  loadingNext: boolean;
  error: string | null;
  onThumb: () => void;
  onFlag: () => void;
  onNext: () => void;
  onNew: () => void;
};

function ViewMode({
  drawing,
  voted,
  hidden,
  voteBusy,
  loadingNext,
  error,
  onThumb,
  onFlag,
  onNext,
  onNew,
}: ViewModeProps) {
  const palette = getPalette(drawing.paletteId);
  const replay = useReplay(drawing.strokes);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <EtchFrame overlay={<ShortIdChip id={drawing.id} />}>
        <EtchCanvas
          mode="view"
          palette={palette}
          strokes={drawing.strokes}
          replayStrokesShown={replay.replayStrokesShown}
          replayPartialPoints={replay.replayPartialPoints}
        />
      </EtchFrame>
      <div style={{ width: 260 }}>
        <ViewerControls
          drawing={drawing}
          replayDone={replay.done}
          voted={voted}
          hidden={hidden}
          voteBusy={voteBusy}
          loadingNext={loadingNext}
          error={error}
          onThumb={onThumb}
          onFlag={onFlag}
          onNext={onNext}
          onNew={onNew}
        />
      </div>
    </div>
  );
}
