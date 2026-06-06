import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Easy Mickey — Hongyok CGM48 Fansite",
  description:
    "Hongyok CGM48 Fansite by Mickey's House",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a12] text-[#f0eff8] antialiased">
        {children}
      </body>
    </html>
  );
}
