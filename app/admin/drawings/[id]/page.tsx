"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AdminChrome } from "../../AdminChrome";
import { SketchReplay } from "@/app/components/SketchReplay";
import { adminApi, AdminApiError } from "@/lib/adminApiClient";
import type { AdminDrawingDTO, AdminVote, DrawingStatus } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminDrawingDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [drawing, setDrawing] = useState<AdminDrawingDTO | null>(null);
  const [votes, setVotes] = useState<AdminVote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all([adminApi.getDrawing(id), adminApi.getVotes(id)])
      .then(([d, v]) => {
        if (cancelled) return;
        setDrawing(d.drawing);
        setVotes(v.votes);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof AdminApiError && err.status === 401) return;
        setError(err instanceof Error ? err.message : "Failed to load drawing");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleStatus = async () => {
    if (!drawing) return;
    const next: DrawingStatus = drawing.status === "active" ? "hidden" : "active";
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi.setStatus(drawing.id, next);
      setDrawing(res.drawing);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminChrome title={drawing ? `Drawing ${drawing.id.slice(0, 8)}` : "Drawing"}>
      {error ? <div className="admin-error">{error}</div> : null}

      {!drawing ? (
        <div>Loading drawing...</div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <SketchReplay
              paletteId={drawing.paletteId}
              strokes={drawing.strokes}
            />
            <div
              className="w95-raised admin-section"
              style={{ minWidth: 280, flex: 1 }}
            >
              <h2>Metadata</h2>
              <dl className="admin-meta">
                <dt>Id</dt>
                <dd>{drawing.id}</dd>
                <dt>Status</dt>
                <dd>
                  <span
                    className={`admin-status-badge admin-status-${drawing.status}`}
                  >
                    {drawing.status}
                  </span>
                </dd>
                <dt>Author</dt>
                <dd>{drawing.authorName}</dd>
                <dt>Created</dt>
                <dd>{new Date(drawing.createdAt).toLocaleString()}</dd>
                <dt>Palette</dt>
                <dd>{drawing.paletteId}</dd>
                <dt>Points</dt>
                <dd>{drawing.pointCount}</dd>
                <dt>Thumbs / Flags</dt>
                <dd>
                  {drawing.thumbsUp} / {drawing.flagCount}
                </dd>
                <dt>Prompt</dt>
                <dd>{drawing.promptText ?? "(free draw)"}</dd>
                <dt>Creator anon id</dt>
                <dd>{drawing.creatorAnonId}</dd>
              </dl>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="w95-button"
                  disabled={busy}
                  onClick={toggleStatus}
                >
                  {drawing.status === "active" ? "Hide drawing" : "Restore drawing"}
                </button>
                <Link
                  href={`/admin/drawings?q=${encodeURIComponent(drawing.creatorAnonId)}`}
                  className="w95-button"
                  style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                >
                  Other drawings by creator
                </Link>
              </div>
            </div>
          </div>

          <div className="w95-raised admin-section">
            <h2>Votes</h2>
            {!votes ? (
              <div>Loading votes...</div>
            ) : votes.length === 0 ? (
              <div>No votes yet.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>When</th>
                    <th>Voter</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((v, i) => (
                    <tr key={i}>
                      <td>{v.type}</td>
                      <td>{new Date(v.createdAt).toLocaleString()}</td>
                      <td>{v.anonIdPreview}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AdminChrome>
  );
}
