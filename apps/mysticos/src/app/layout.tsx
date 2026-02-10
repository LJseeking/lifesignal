import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life Signal - 个人化生活决策辅助系统",
  description: "不做预测，只给建议",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-slate-100`}>
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
