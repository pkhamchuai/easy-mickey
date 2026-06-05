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
  title: "Easy Mickey — หงษ์หยก CGM48",
  description:
    "แฟนไซต์สำหรับหงษ์หยก (Hongyok) แห่ง CGM48 และ Mickey's House Fanbase",
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
