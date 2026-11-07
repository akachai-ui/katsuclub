import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KATSU CLUB - จัดการวัตถุดิบ (Mobile Inventory)",
  description: "ระบบบริหารจัดการวัตถุดิบร้านอาหาร Katsu Club สไตล์ญี่ปุ่น สำหรับมือถือ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full antialiased font-sans flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
