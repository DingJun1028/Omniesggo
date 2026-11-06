import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniNote: Unified 控制台",
  description: "萬能筆記 OmniNote — 液態玻璃 Web 控制台（速記、塗鴉、雙鏈熔合、結晶、封印）",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
