import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ClientGate } from "@/components/shell/client-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "培驰商学 · Pitch",
  description: "培驰商学是专业的资本辅导与资源对接平台。读懂资本，反向经营。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ClientGate>
          <AppShell>{children}</AppShell>
        </ClientGate>
      </body>
    </html>
  );
}
