import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { cookies } from "next/headers";
import { getDictionary, Locale } from "@/lib/dictionaries";
import { DictionaryProvider } from "@/components/providers/DictionaryProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from 'nextjs-toploader';
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BGU Course Catalog",
  description: "Course catalog, prerequisite map, and weekly schedule planner for Ben-Gurion University",
  icons: {
    icon: "/favicon.png",
  },
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
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased selection:bg-primary/15`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <DictionaryProvider dictionary={dictionary} locale={locale}>
            <QueryProvider>
              <AuthProvider>
                <NextTopLoader 
                  color="#059669"
                  initialPosition={0.08}
                  crawlSpeed={200}
                  height={2}
                  crawl={true}
                  showSpinner={false}
                  easing="ease"
                  speed={200}
                />
                <Navbar />
                {children}
                <OnboardingDialog />
                <Toaster position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'} dir={dir} duration={3200} />
              </AuthProvider>
            </QueryProvider>
          </DictionaryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
