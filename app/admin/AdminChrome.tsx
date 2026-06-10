"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi, AdminApiError } from "@/lib/adminApiClient";

type AdminChromeProps = {
  title: string;
  children: React.ReactNode;
};

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/drawings", label: "Drawings" },
  { href: "/admin/drawings?status=hidden&sort=flags_desc", label: "Moderation queue" },
];

export function AdminChrome({ title, children }: AdminChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    if (path === "/admin") return pathname === "/admin";
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await adminApi.logout();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      if (!(err instanceof AdminApiError)) {
        console.error(err);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-shell">
      <div className="w95-raised admin-window" style={{ padding: 2 }}>
        <div className="admin-titlebar">
          <span>Share-a-Sketch Admin - {title}</span>
        </div>
        <div className="w95-sunken admin-nav">
          <div className="admin-nav-links">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "is-active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="w95-button"
            onClick={onLogout}
            disabled={busy}
          >
            Log out
          </button>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
