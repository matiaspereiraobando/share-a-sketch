"use client";

import { PALETTES, type Palette } from "@/lib/palettes";
import { STROKE_WIDTHS } from "@/lib/constants";

type ToolbarProps = {
  palette: Palette;
  paletteId: string;
  colorIndex: number;
  widthIndex: number;
  pointCount: number;
  maxPoints: number;
  canUndo: boolean;
  canReset: boolean;
  canShare: boolean;
  onPaletteChange: (id: string) => void;
  onColorChange: (index: number) => void;
  onWidthChange: (index: number) => void;
  onUndo: () => void;
  onReset: () => void;
  onShare: () => void;
};

export function Toolbar({
  palette,
  paletteId,
  colorIndex,
  widthIndex,
  pointCount,
  maxPoints,
  canUndo,
  canReset,
  canShare,
  onPaletteChange,
  onColorChange,
  onWidthChange,
  onUndo,
  onReset,
  onShare,
}: ToolbarProps) {
  const pct = Math.min(100, Math.round((pointCount / maxPoints) * 100));

  return (
    <div
      className="w95-raised"
      style={{
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label htmlFor="palette-select">Palette:</label>
        <select
          id="palette-select"
          value={paletteId}
          onChange={(e) => onPaletteChange(e.target.value)}
          style={{
            fontFamily: "var(--font-system)",
            fontSize: 11,
          }}
        >
          {PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div
        className="w95-sunken"
        style={{
          padding: 4,
          display: "grid",
          gridTemplateColumns: "repeat(10, 1fr)",
          gap: 2,
          background: "var(--w95-bg-light)",
        }}
      >
        {palette.colors.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onColorChange(i)}
            title={`Color ${i + 1}: ${c}`}
            aria-label={`Color ${i + 1}`}
            aria-pressed={i === colorIndex}
            style={{
              width: 20,
              height: 20,
              padding: 0,
              background: c,
              border:
                i === colorIndex
                  ? "2px solid var(--w95-text)"
                  : "1px solid var(--w95-bg-darker)",
              boxShadow:
                i === colorIndex
                  ? "0 0 0 1px var(--w95-bg-lightest)"
                  : "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>Width:</span>
        {STROKE_WIDTHS.map((w, i) => (
          <button
            key={i}
            type="button"
            className="w95-button"
            onClick={() => onWidthChange(i)}
            aria-pressed={i === widthIndex}
            style={{
              minWidth: 32,
              padding: 4,
              fontWeight: i === widthIndex ? "bold" : "normal",
              background:
                i === widthIndex ? "var(--w95-bg-light)" : "var(--w95-bg)",
            }}
            title={`${w}px`}
          >
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 24,
                height: w,
                background: palette.colors[colorIndex] ?? "#000",
                verticalAlign: "middle",
              }}
            />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          className="w95-button"
          onClick={onUndo}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="w95-button"
          onClick={onReset}
          disabled={!canReset}
        >
          Reset
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="w95-button"
          onClick={onShare}
          disabled={!canShare}
          style={{ fontWeight: "bold", minWidth: 96 }}
        >
          Share
        </button>
      </div>

      <PointBudgetBar pointCount={pointCount} maxPoints={maxPoints} pct={pct} />
    </div>
  );
}

function PointBudgetBar({
  pointCount,
  maxPoints,
  pct,
}: {
  pointCount: number;
  maxPoints: number;
  pct: number;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <span>Ink:</span>
        <span>
          {pointCount} / {maxPoints} ({pct}%)
        </span>
      </div>
      <div
        className="w95-sunken"
        style={{
          height: 16,
          padding: 2,
          background: "var(--w95-bg-light)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background:
              pct >= 100
                ? "linear-gradient(180deg, #c14b4b 0%, #8a2a2a 100%)"
                : "linear-gradient(180deg, var(--w95-titlebar) 0%, #4a4ab3 100%)",
            transition: "width 60ms linear",
          }}
        />
      </div>
    </div>
  );
}
