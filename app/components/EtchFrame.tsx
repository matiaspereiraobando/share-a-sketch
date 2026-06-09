"use client";

import type { ReactNode } from "react";

type EtchFrameProps = {
  children: ReactNode;
  /** Optional overlay rendered on top of the canvas (e.g. short id for viewer). */
  overlay?: ReactNode;
};

/**
 * Powder-blue Etch-a-Sketch-style bezel around the canvas, with two faux
 * knobs at the bottom.
 */
export function EtchFrame({ children, overlay }: EtchFrameProps) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, var(--etch-bezel-light) 0%, var(--etch-bezel) 40%, var(--etch-bezel-dark) 100%)",
        border: "2px solid var(--etch-bezel-dark)",
        borderRadius: 18,
        padding: 16,
        boxShadow:
          "inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.2)",
        width: "fit-content",
      }}
    >
      <div
        className="w95-sunken"
        style={{
          padding: 4,
          position: "relative",
          background: "var(--canvas-bg)",
        }}
      >
        {children}
        {overlay ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {overlay}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          padding: "0 8px",
        }}
      >
        <Knob />
        <div
          style={{
            fontFamily: "var(--font-system)",
            fontSize: 13,
            fontWeight: "bold",
            color: "var(--w95-bg-darker)",
            textShadow: "1px 1px 0 rgba(255,255,255,0.4)",
            letterSpacing: 1,
          }}
        >
          SHARE-A-SKETCH
        </div>
        <Knob />
      </div>
    </div>
  );
}

function Knob() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 30%, #ffffff 0%, #e0e0e0 35%, #808080 100%)",
        border: "2px solid var(--w95-bg-darker)",
        boxShadow:
          "inset 0 2px 0 rgba(255,255,255,0.4), 0 2px 0 rgba(0,0,0,0.3)",
        position: "relative",
      }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "10%",
          right: "10%",
          height: 2,
          background: "var(--w95-bg-darker)",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}
