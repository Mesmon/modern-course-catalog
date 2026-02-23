import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionaries";
import { DictionaryProvider } from "@/components/providers/DictionaryProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Course Catalog",
  description: "Modern course catalog",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = localeCookie === 'en' ? 'en' : 'he';
  const dictionary = getDictionary(locale);
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={`${inter.className} min-h-screen bg-slate-50 antialiased selection:bg-primary/20`}>
        <DictionaryProvider dictionary={dictionary} locale={locale}>
          <QueryProvider>
            <Navbar />
            {children}
          </QueryProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}

