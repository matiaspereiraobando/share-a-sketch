"use client";

import { useEffect, useRef, useState } from "react";

type ShareDialogProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  /** Prompt the player opted in for; null when they did not opt in. */
  promptText: string | null;
  onCancel: () => void;
  onSubmit: (name: string, usedPrompt: boolean) => void;
};

const MAX_NAME_LENGTH = 24;

export function ShareDialog({
  open,
  busy = false,
  error,
  promptText,
  onCancel,
  onSubmit,
}: ShareDialogProps) {
  const [name, setName] = useState("");
  const [confirmPrompt, setConfirmPrompt] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setConfirmPrompt(true);
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (busy) return;
    const usedPrompt = promptText !== null && confirmPrompt;
    onSubmit(name.trim().slice(0, MAX_NAME_LENGTH), usedPrompt);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="w95-raised"
        style={{
          padding: 2,
          minWidth: 320,
          maxWidth: "90vw",
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) onCancel();
          if (e.key === "Enter") submit();
        }}
      >
        <div
          style={{
            background: "var(--w95-titlebar)",
            color: "var(--w95-titlebar-text)",
            padding: "2px 4px",
            fontWeight: "bold",
            marginBottom: 2,
          }}
          id="share-dialog-title"
        >
          Share your sketch
        </div>
        <div style={{ padding: 12 }}>
          <p style={{ marginTop: 0 }}>
            Sign your masterpiece (or leave it blank to stay anonymous).
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label htmlFor="author-name">Name:</label>
            <input
              ref={inputRef}
              id="author-name"
              type="text"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="w95-sunken"
              style={{
                flex: 1,
                fontFamily: "var(--font-system)",
                fontSize: 11,
                padding: 3,
                background: "var(--w95-bg-lightest)",
                border: "none",
              }}
              placeholder="(anonymous)"
            />
          </div>
          {promptText ? (
            <div
              className="w95-sunken"
              style={{
                marginTop: 10,
                padding: 6,
                background: "var(--w95-bg-light)",
                fontSize: 11,
              }}
            >
              <div style={{ color: "var(--w95-bg-darker)" }}>Drawn for:</div>
              <div style={{ fontWeight: "bold", marginTop: 2, marginBottom: 6 }}>
                &quot;{promptText}&quot;
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmPrompt}
                  onChange={(e) => setConfirmPrompt(e.target.checked)}
                  disabled={busy}
                />
                <span>Yep, I drew this</span>
              </label>
            </div>
          ) : null}
          {error ? (
            <div
              role="alert"
              style={{
                marginTop: 8,
                padding: 4,
                background: "#ffcccc",
                border: "1px solid #aa0000",
                color: "#660000",
              }}
            >
              {error}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 4,
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="w95-button"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w95-button"
              onClick={submit}
              disabled={busy}
              style={{ fontWeight: "bold" }}
            >
              {busy ? "Sharing..." : "Share!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
