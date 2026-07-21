import type { Metadata } from "next";
import "@meminios/ui/styles.css";
import "./landing.css";

export const metadata: Metadata = {
  title: "MeminiOS — the brain layer for your company’s AI",
  description:
    "Permissions-aware institutional memory, proactive signals, and governed skills for AI agents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
