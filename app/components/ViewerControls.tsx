"use client";

import type { DrawingDTO } from "@/lib/types";

type ViewerControlsProps = {
  drawing: DrawingDTO;
  replayDone: boolean;
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

export function ViewerControls({
  drawing,
  replayDone,
  voted,
  hidden,
  voteBusy,
  loadingNext,
  error,
  onThumb,
  onFlag,
  onNext,
  onNew,
}: ViewerControlsProps) {
  const reactionsDisabled = !replayDone || voted !== null || voteBusy || hidden;

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
      <div className="w95-sunken" style={{ padding: 6, background: "var(--w95-bg-light)" }}>
        <div style={{ fontSize: 10, color: "var(--w95-bg-darker)" }}>
          drawn by
        </div>
        <div style={{ fontWeight: "bold", fontSize: 13 }}>
          {drawing.authorName}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Stat symbol="+" value={drawing.thumbsUp} label="thumbs" />
        <Stat symbol="!" value={drawing.flagCount} label="flags" />
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          className="w95-button"
          onClick={onThumb}
          disabled={reactionsDisabled}
          style={{ flex: 1 }}
          title={
            !replayDone
              ? "Wait for the drawing to finish"
              : voted
                ? "You already reacted"
                : "Like this sketch"
          }
        >
          {voted === "thumb" ? "Thumbed!" : "Thumbs up"}
        </button>
        <button
          type="button"
          className="w95-button"
          onClick={onFlag}
          disabled={reactionsDisabled}
          style={{ flex: 1 }}
          title={
            !replayDone
              ? "Wait for the drawing to finish"
              : voted
                ? "You already reacted"
                : "Flag this sketch as inappropriate"
          }
        >
          {voted === "flag" ? "Flagged!" : "Flag"}
        </button>
      </div>

      {hidden ? (
        <div
          role="alert"
          style={{
            padding: 4,
            background: "#fff2cc",
            border: "1px solid #aa8800",
            color: "#665500",
            fontSize: 11,
          }}
        >
          This sketch has been hidden after enough flags.
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          style={{
            padding: 4,
            background: "#ffcccc",
            border: "1px solid #aa0000",
            color: "#660000",
            fontSize: 11,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          className="w95-button"
          onClick={onNext}
          disabled={loadingNext}
          style={{ flex: 1 }}
        >
          {loadingNext ? "Loading..." : "Show another"}
        </button>
        <button
          type="button"
          className="w95-button"
          onClick={onNew}
          style={{ flex: 1, fontWeight: "bold" }}
        >
          Draw new
        </button>
      </div>
    </div>
  );
}

function Stat({
  symbol,
  value,
  label,
}: {
  symbol: string;
  value: number;
  label: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        aria-hidden
        style={{
          fontSize: 16,
          fontWeight: "bold",
          lineHeight: 1,
          color: "var(--w95-bg-darker)",
        }}
      >
        {symbol}
      </div>
      <div style={{ fontWeight: "bold", fontSize: 13 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--w95-bg-darker)" }}>{label}</div>
    </div>
  );
}
