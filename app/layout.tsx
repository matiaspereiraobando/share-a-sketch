import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Share-a-Sketch",
  description: "Draw a sketch, share it, and see what others have drawn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
