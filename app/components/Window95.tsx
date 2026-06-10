"use client";

import type { ReactNode } from "react";

type Window95Props = {
  title: string;
  children: ReactNode;
  /** When set, renders a functional "?" button before the decorative chrome. */
  onHelp?: () => void;
};

export function Window95({ title, children, onHelp }: Window95Props) {
  return (
    <div
      className="w95-raised"
      style={{
        padding: 2,
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          background: "var(--w95-titlebar)",
          color: "var(--w95-titlebar-text)",
          padding: "2px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: "bold",
          marginBottom: 2,
          userSelect: "none",
        }}
      >
        <span>{title}</span>
        <span style={{ display: "flex", gap: 2 }}>
          {onHelp ? (
            <button
              type="button"
              className="w95-raised"
              aria-label="How to play"
              title="How to play"
              onClick={onHelp}
              style={{
                width: 16,
                height: 14,
                fontSize: 10,
                color: "var(--w95-text)",
                background: "var(--w95-bg)",
                padding: 0,
                fontWeight: "bold",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ?
            </button>
          ) : null}
          <FakeChromeButton label="_" />
          <FakeChromeButton label="□" />
          <FakeChromeButton label="✕" />
        </span>
      </div>
      <div style={{ padding: 8 }}>{children}</div>
    </div>
  );
}

function FakeChromeButton({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="w95-raised"
      style={{
        width: 16,
        height: 14,
        fontSize: 10,
        color: "var(--w95-text)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "normal",
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}
