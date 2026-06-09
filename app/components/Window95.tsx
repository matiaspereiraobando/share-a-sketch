"use client";

import type { ReactNode } from "react";

type Window95Props = {
  title: string;
  children: ReactNode;
};

export function Window95({ title, children }: Window95Props) {
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
