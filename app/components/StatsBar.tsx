"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import type { StatsDTO } from "@/lib/types";

type StatsBarProps = {
  refreshKey?: number;
};

export function StatsBar({ refreshKey = 0 }: StatsBarProps) {
  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div
      className="w95-sunken"
      style={{
        marginTop: 8,
        padding: "3px 8px",
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        fontSize: 12,
        color: "var(--w95-text)",
      }}
    >
      {error ? (
        <span style={{ color: "var(--w95-text-disabled)" }}>
          Stats unavailable
        </span>
      ) : stats === null ? (
        <span style={{ color: "var(--w95-text-disabled)" }}>
          Loading stats...
        </span>
      ) : (
        <>
          <Stat label="Sketches" value={stats.totalDrawings} />
          <Stat label="Ink" value={stats.totalInk} />
          <Stat label="Artists" value={stats.uniqueCreators} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span style={{ fontWeight: "bold" }}>{label}:</span>{" "}
      {value.toLocaleString()}
    </span>
  );
}
