import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Course Catalog",
  description: "Modern course catalog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.className} min-h-screen bg-slate-50 antialiased selection:bg-primary/20`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
