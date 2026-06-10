"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminChrome } from "../AdminChrome";
import { adminApi, AdminApiError, type AdminListQuery } from "@/lib/adminApiClient";
import type { AdminDrawingListResponse, AdminDrawingSummary } from "@/lib/types";

const PAGE_SIZE = 25;

type Status = NonNullable<AdminListQuery["status"]>;
type Sort = NonNullable<AdminListQuery["sort"]>;

const STATUSES: Status[] = ["all", "active", "hidden"];
const SORTS: { value: Sort; label: string }[] = [
  { value: "created_desc", label: "Newest" },
  { value: "flags_desc", label: "Most flags" },
  { value: "thumbs_desc", label: "Most thumbs" },
];

function readQuery(searchParams: URLSearchParams): {
  status: Status;
  q: string;
  sort: Sort;
  page: number;
} {
  const statusParam = searchParams.get("status") as Status | null;
  const sortParam = searchParams.get("sort") as Sort | null;
  return {
    status: statusParam && STATUSES.includes(statusParam) ? statusParam : "all",
    q: searchParams.get("q") ?? "",
    sort:
      sortParam && SORTS.some((s) => s.value === sortParam)
        ? sortParam
        : "created_desc",
    page: Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1),
  };
}

export default function AdminDrawingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = readQuery(new URLSearchParams(searchParams.toString()));

  const [data, setData] = useState<AdminDrawingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(query.q);

  useEffect(() => {
    setSearch(query.q);
  }, [query.q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminApi
      .listDrawings({
        status: query.status,
        q: query.q || undefined,
        sort: query.sort,
        page: query.page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof AdminApiError) || err.status !== 401) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query.status, query.q, query.sort, query.page]);

  const updateQuery = (patch: Partial<typeof query>) => {
    const next = { ...query, ...patch, page: patch.page ?? 1 };
    const params = new URLSearchParams();
    if (next.status !== "all") params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (next.sort !== "created_desc") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    router.push(qs ? `/admin/drawings?${qs}` : "/admin/drawings");
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <AdminChrome title="Drawings">
      <div className="w95-raised admin-section">
        <form
          className="admin-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            updateQuery({ q: search.trim() });
          }}
        >
          <label>
            Status
            <select
              value={query.status}
              onChange={(e) =>
                updateQuery({ status: e.target.value as Status })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select
              value={query.sort}
              onChange={(e) => updateQuery({ sort: e.target.value as Sort })}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1, minWidth: 200 }}>
            Search (id or author)
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="UUID prefix or author name"
            />
          </label>
          <button type="submit" className="w95-button">
            Apply
          </button>
        </form>
      </div>

      {error ? <div className="admin-error">{error}</div> : null}

      <div className="w95-raised admin-section" style={{ overflow: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th>Points</th>
              <th>Thumbs</th>
              <th>Flags</th>
              <th>Prompt</th>
              <th>Creator</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr>
                <td colSpan={9}>Loading...</td>
              </tr>
            ) : data && data.items.length === 0 ? (
              <tr>
                <td colSpan={9}>No drawings match these filters.</td>
              </tr>
            ) : (
              data?.items.map((row) => <DrawingRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>

        {data ? (
          <Pagination
            page={query.page}
            totalPages={totalPages}
            total={data.total}
            onChange={(page) => updateQuery({ page })}
          />
        ) : null}
      </div>
    </AdminChrome>
  );
}

function DrawingRow({ row }: { row: AdminDrawingSummary }) {
  return (
    <tr className={row.status === "hidden" ? "is-hidden" : undefined}>
      <td>
        <Link href={`/admin/drawings/${row.id}`}>{row.id.slice(0, 8)}</Link>
      </td>
      <td>{row.authorName}</td>
      <td>
        <span className={`admin-status-badge admin-status-${row.status}`}>
          {row.status}
        </span>
      </td>
      <td>{new Date(row.createdAt).toLocaleString()}</td>
      <td>{row.pointCount}</td>
      <td>{row.thumbsUp}</td>
      <td>{row.flagCount}</td>
      <td>{row.promptText ?? "-"}</td>
      <td>{row.creatorAnonId.slice(0, 8)}...</td>
    </tr>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
      }}
    >
      <div>
        Page {page} of {totalPages} - {total.toLocaleString()} total
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          className="w95-button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </button>
        <button
          type="button"
          className="w95-button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
