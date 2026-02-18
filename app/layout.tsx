import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AI チャットアシスタント (powered by GPT-5 nano)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-900 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
