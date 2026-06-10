import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Share-a-Sketch Admin",
  robots: { index: false, follow: false },
};

// Admin pages are auth-gated and read URL params at runtime, so prerendering
// is neither possible nor useful. Forcing dynamic rendering for the segment
// avoids missing-Suspense bailout errors during build.
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
