"use client";

type PromptPanelProps = {
  prompt: string;
  optedIn: boolean;
  dismissed: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  onReset: () => void;
};

/**
 * PROMPT.TXT sub-window shown above the canvas in draw mode.
 *
 *   - neutral  (optedIn=false, dismissed=false): full panel with two buttons
 *   - using    (optedIn=true): pressed/active panel, "Drawing for: ..."
 *   - free     (dismissed=true): compact bar with a link to bring the prompt back
 */
export function PromptPanel({
  prompt,
  optedIn,
  dismissed,
  onAccept,
  onDismiss,
  onReset,
}: PromptPanelProps) {
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
        }}
      >
        <span>Free draw mode.</span>
        <button
          type="button"
          onClick={onReset}
          className="w95-button"
          style={{ minWidth: 0, padding: "0 6px", fontSize: 11 }}
        >
          Show today's prompt
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
        {optedIn ? (
          <>
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
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, color: "var(--w95-bg-darker)" }}>
              Today&apos;s prompt:
            </div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: 13,
                marginTop: 2,
                marginBottom: 8,
              }}
            >
              &quot;{prompt}&quot;
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button
                type="button"
                className="w95-button"
                onClick={onAccept}
                style={{ fontWeight: "bold" }}
              >
                Use this prompt
              </button>
              <button
                type="button"
                className="w95-button"
                onClick={onDismiss}
              >
                Free draw
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
