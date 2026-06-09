"use client";

import { useState } from "react";

type ShortIdChipProps = {
  id: string;
};

/**
 * Tiny click-to-copy chip showing the first 8 chars of a drawing's uuid.
 * Used in the viewer overlay so a person can easily report a sketch.
 */
export function ShortIdChip({ id }: ShortIdChipProps) {
  const [copied, setCopied] = useState(false);
  const short = id.slice(0, 8);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Click to copy full id: ${id}`}
      style={{
        position: "absolute",
        bottom: 4,
        right: 4,
        fontFamily: "var(--font-system)",
        fontSize: 10,
        padding: "1px 6px",
        background: "rgba(255, 255, 255, 0.75)",
        color: "var(--w95-bg-darker)",
        border: "1px solid var(--w95-bg-dark)",
        cursor: "pointer",
        pointerEvents: "auto",
        opacity: 0.75,
      }}
    >
      {copied ? "copied!" : `id: ${short}`}
    </button>
  );
}
