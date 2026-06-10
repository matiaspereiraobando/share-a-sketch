"use client";

type PromptGateOverlayProps = {
  prompt: string;
  onAccept: () => void;
  onDismiss: () => void;
};

/**
 * Blocks the canvas until the player picks "Use this prompt" or "Free draw".
 * Rendered as an EtchFrame overlay so drawing cannot start in the neutral state.
 */
export function PromptGateOverlay({
  prompt,
  onAccept,
  onDismiss,
}: PromptGateOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-gate-title"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        background: "rgba(0, 0, 0, 0.35)",
        pointerEvents: "auto",
        zIndex: 1,
      }}
    >
      <div
        className="w95-raised"
        style={{
          padding: 2,
          width: "min(280px, 100%)",
        }}
      >
        <div
          id="prompt-gate-title"
          style={{
            background: "var(--w95-titlebar)",
            color: "var(--w95-titlebar-text)",
            padding: "2px 4px",
            fontWeight: "bold",
            marginBottom: 2,
            fontSize: 11,
            userSelect: "none",
          }}
        >
          PROMPT.TXT
        </div>
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 10, color: "var(--w95-bg-darker)" }}>
            Today&apos;s prompt:
          </div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: 13,
              marginTop: 2,
              marginBottom: 10,
              lineHeight: 1.35,
            }}
          >
            &quot;{prompt}&quot;
          </div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              color: "var(--w95-bg-darker)",
              lineHeight: 1.35,
            }}
          >
            Pick one before you draw.
          </p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button
              type="button"
              className="w95-button"
              onClick={onAccept}
              style={{ fontWeight: "bold", flex: 1, minWidth: 120 }}
            >
              Use this prompt
            </button>
            <button
              type="button"
              className="w95-button"
              onClick={onDismiss}
              style={{ flex: 1, minWidth: 120 }}
            >
              Free draw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type PromptPanelProps = {
  prompt: string;
  optedIn: boolean;
  dismissed: boolean;
  onDismiss: () => void;
  onReset: () => void;
};

/**
 * Compact prompt status above the canvas after the player has chosen.
 * Pending state (no choice yet) is handled by PromptGateOverlay on the canvas.
 */
export function PromptPanel({
  prompt,
  optedIn,
  dismissed,
  onDismiss,
  onReset,
}: PromptPanelProps) {
  const pending = !optedIn && !dismissed;
  if (pending) return null;

  if (dismissed && !optedIn) {
    return (
      <div
        className="w95-sunken"
        style={{
          padding: "3px 8px",
          fontSize: 11,
          color: "var(--w95-text-disabled)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span>Free draw mode.</span>
        <button
          type="button"
          onClick={onReset}
          className="w95-button"
          style={{ minWidth: 0, padding: "0 6px", fontSize: 11 }}
        >
          Show today&apos;s prompt
        </button>
      </div>
    );
  }

  return (
    <div
      className="w95-raised"
      style={{
        padding: 2,
        width: "100%",
      }}
    >
      <div
        style={{
          background: "var(--w95-titlebar)",
          color: "var(--w95-titlebar-text)",
          padding: "2px 4px",
          fontWeight: "bold",
          marginBottom: 2,
          fontSize: 11,
          userSelect: "none",
        }}
      >
        PROMPT.TXT
      </div>
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 10, color: "var(--w95-bg-darker)" }}>
          Drawing for:
        </div>
        <div
          style={{
            fontWeight: "bold",
            fontSize: 13,
            marginTop: 2,
            marginBottom: 6,
          }}
        >
          &quot;{prompt}&quot;
        </div>
        <button
          type="button"
          className="w95-button"
          onClick={onDismiss}
          style={{ minWidth: 0, padding: "2px 8px", fontSize: 11 }}
        >
          Change my mind (free draw)
        </button>
      </div>
    </div>
  );
}
