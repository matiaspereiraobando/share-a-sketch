"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminChrome } from "./AdminChrome";
import { adminApi, AdminApiError } from "@/lib/adminApiClient";
import type { AdminStatsDTO } from "@/lib/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof AdminApiError) || err.status !== 401) {
          setError(err instanceof Error ? err.message : "Failed to load stats");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminChrome title="Dashboard">
      {error ? <div className="admin-error">{error}</div> : null}
      {stats ? <StatsGrid stats={stats} /> : <div>Loading stats...</div>}
      {stats ? <SubmissionsTrend stats={stats} /> : null}
      <div className="w95-raised admin-section">
        <h2>Quick links</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Link href="/admin/drawings">All drawings</Link>
          </li>
          <li>
            <Link href="/admin/drawings?status=hidden&sort=flags_desc">
              Hidden drawings
            </Link>
          </li>
          <li>
            <Link href="/admin/drawings?sort=flags_desc">Most-flagged</Link>
          </li>
          <li>
            <Link href="/admin/drawings?sort=thumbs_desc">Most-thumbed</Link>
          </li>
        </ul>
      </div>
    </AdminChrome>
  );
}

function StatsGrid({ stats }: { stats: AdminStatsDTO }) {
  const cards: { label: string; value: string }[] = [
    { label: "Total drawings", value: fmt(stats.totalDrawings) },
    { label: "Active", value: fmt(stats.activeDrawings) },
    { label: "Hidden", value: fmt(stats.hiddenDrawings) },
    { label: "Unique creators", value: fmt(stats.uniqueCreators) },
    { label: "Total ink (points)", value: fmt(stats.totalInk) },
    { label: "Total votes", value: fmt(stats.totalVotes) },
    { label: "Thumbs up", value: fmt(stats.totalThumbs) },
    { label: "Flags", value: fmt(stats.totalFlags) },
  ];
  return (
    <div className="admin-stat-grid">
      {cards.map((c) => (
        <div key={c.label} className="w95-raised admin-stat-card">
          <div className="admin-stat-label">{c.label}</div>
          <div className="admin-stat-value">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function SubmissionsTrend({ stats }: { stats: AdminStatsDTO }) {
  const max = Math.max(1, ...stats.submissionsLast7Days.map((d) => d.count));
  return (
    <div className="w95-raised admin-section">
      <h2>Submissions, last 7 days</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {stats.submissionsLast7Days.map((d) => (
          <div key={d.date} className="admin-bar-row">
            <div>{d.date}</div>
            <div className="admin-bar-track">
              <div
                className="admin-bar-fill"
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <div style={{ textAlign: "right" }}>{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString();
}
