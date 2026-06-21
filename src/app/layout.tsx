import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مسجد نور الإيمان",
  description: "الموقع الرسمي لمسجد نور الإيمان - بلبيس",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className="bg-surface min-h-screen">{children}</body>
    </html>
  );
}
