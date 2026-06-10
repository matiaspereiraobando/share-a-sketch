"use client";

import { useEffect } from "react";

type OnboardingDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * First-visit "how it works" splash. Shown automatically once per browser
 * (gated by localStorage in page.tsx) and reopenable from the title-bar
 * "?" button at any time.
 */
export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-dialog-title"
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w95-raised"
        style={{
          padding: 2,
          minWidth: 320,
          maxWidth: "min(480px, 92vw)",
        }}
      >
        <div
          id="onboarding-dialog-title"
          style={{
            background: "var(--w95-titlebar)",
            color: "var(--w95-titlebar-text)",
            padding: "2px 4px",
            fontWeight: "bold",
            marginBottom: 2,
          }}
        >
          Welcome to Share-a-Sketch
        </div>
        <div style={{ padding: 12, lineHeight: 1.5 }}>
          <p style={{ marginTop: 0 }}>
            A retro public sketchbook. Here&apos;s how it works:
          </p>
          <ol style={{ paddingLeft: 22, margin: "8px 0" }}>
            <li>
              <b>Draw</b> something on the Etch-a-Sketch screen.
            </li>
            <li>
              <b>Share</b> it with the world.
            </li>
            <li>
              You&apos;ll <b>unlock</b> the public sketchbook and watch a
              random sketch by someone else, replayed stroke by stroke.
            </li>
            <li>
              <b>Vote</b> thumbs up on the ones you like, or flag the gross
              ones.
            </li>
          </ol>
          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 11,
              color: "var(--w95-bg-darker)",
            }}
          >
            No accounts, no logins. You can reopen this any time from the
            <b> ? </b> button in the title bar.
          </p>
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
              onClick={onClose}
              style={{ fontWeight: "bold" }}
              autoFocus
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
