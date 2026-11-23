import type { Metadata } from "next";
import type { ReactNode } from "react";
// JunAiKey 基礎設計層（設計代幣＋可重用元件樣式），先於 globals.css 引入：
// 液態玻璃應用層於 globals.css 對其覆寫與語意延伸。
// JunAiKey base design layer (design tokens + reusable component styles), imported
// before globals.css so the liquid-glass app layer can override it there.
import "@esggo/tailwind-preset/junaikey-ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniNote: Unified 控制台",
  description: "萬能筆記 OmniNote — 液態玻璃 Web 控制台（速記、塗鴉、雙鏈熔合、結晶、封印）",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme="dark"：啟用 JunAiKey 深色代幣組（--primary/--focus/--success/--danger 等）
    // data-theme="dark": activates the JunAiKey dark token set (--primary/--focus/--success/--danger etc.)
    <html lang="zh-Hant" data-theme="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
