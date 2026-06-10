"use client";

import { EtchCanvas } from "./EtchCanvas";
import { EtchFrame } from "./EtchFrame";
import { getPalette } from "@/lib/palettes";
import { useReplay } from "@/lib/replay";
import type { StoredStroke } from "@/lib/types";
import type { ReactNode } from "react";

type SketchReplayProps = {
  paletteId: string;
  strokes: StoredStroke[];
  /** Optional overlay drawn on top of the canvas (e.g. short-id chip). */
  overlay?: ReactNode;
};

/**
 * Etch-frame + canvas + replay loop wired together. Used by the public
 * viewer and the admin drawing detail page.
 */
export function SketchReplay({ paletteId, strokes, overlay }: SketchReplayProps) {
  const palette = getPalette(paletteId);
  const replay = useReplay(strokes);
  return (
    <EtchFrame overlay={overlay}>
      <EtchCanvas
        mode="view"
        palette={palette}
        strokes={strokes}
        replayStrokesShown={replay.replayStrokesShown}
        replayPartialPoints={replay.replayPartialPoints}
      />
    </EtchFrame>
  );
}
