"use client";

import { useEffect, useRef, useState } from "react";

type ShareDialogProps = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (name: string) => void;
};

const MAX_NAME_LENGTH = 24;

export function ShareDialog({
  open,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: ShareDialogProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (busy) return;
    onSubmit(name.trim().slice(0, MAX_NAME_LENGTH));
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
