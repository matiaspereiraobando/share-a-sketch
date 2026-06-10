"use client";

import { useEffect } from "react";

type CelebrationDialogProps = {
  open: boolean;
  /** True when the server returned a `next` sketch to view. */
  hasNext: boolean;
  onContinue: () => void;
};

/**
 * Post-share "click-to-continue" Win95 dialog. Replaces the previous
 * silent jump straight into view mode, and absorbs the empty-pool
 * message that used to flash as a bare error string.
 */
export function CelebrationDialog({
  open,
  hasNext,
  onContinue,
}: CelebrationDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") onContinue();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 12,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
    >
      <div
        className="w95-raised"
        style={{
          padding: 2,
          minWidth: 320,
          maxWidth: "min(440px, 92vw)",
        }}
      >
        <div
          id="celebration-dialog-title"
          style={{
            background: "var(--w95-titlebar)",
            color: "var(--w95-titlebar-text)",
            padding: "2px 4px",
            fontWeight: "bold",
            marginBottom: 2,
          }}
        >
          {hasNext ? "Sketch saved!" : "Welcome to the repository"}
        </div>
        <div style={{ padding: 16, lineHeight: 1.5 }}>
          {hasNext ? (
            <>
              <p style={{ marginTop: 0, fontWeight: "bold" }}>
                Your sketch was saved to PUBLIC REPOSITORY.
              </p>
              <p style={{ marginBottom: 0 }}>
                The gallery is unlocked. Watch what someone else has been
                drawing.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0, fontWeight: "bold" }}>
                You&apos;re the first artist in the PUBLIC REPOSITORY.
              </p>
              <p style={{ marginBottom: 0 }}>
                No other sketches yet. Draw another one, or send a friend a
                link to come play.
              </p>
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="w95-button"
              onClick={onContinue}
              style={{ fontWeight: "bold", minWidth: 120 }}
              autoFocus
            >
              {hasNext ? "View a sketch" : "Draw another"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
