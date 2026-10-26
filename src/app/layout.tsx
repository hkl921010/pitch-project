import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { ClientGate } from "@/components/shell/client-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pitch · 项目原型",
  description: "创始人公开主页 + 统一意向 + 站内对话 + 路演节律",
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
