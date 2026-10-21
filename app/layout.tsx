import type { Metadata } from "next";
import { IBM_Plex_Sans_Hebrew, JetBrains_Mono } from "next/font/google";
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

const ibmPlexSansHebrew = IBM_Plex_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BGU שנתון אקדמי · Course Catalog",
  description: "Course catalog, prerequisite map, and weekly schedule planner for Ben-Gurion University of the Negev",
  icons: {
    icon: "/favicon.png",
  },
  other: {
    "color-scheme": "light dark",
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
      <body
        className={`${ibmPlexSansHebrew.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/15 selection:text-primary`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <DictionaryProvider dictionary={dictionary} locale={locale}>
            <QueryProvider>
              <AuthProvider>
                <NextTopLoader
                  color="#ea580c"
                  initialPosition={0.08}
                  crawlSpeed={200}
                  height={2}
                  crawl={true}
                  showSpinner={false}
                  easing="ease"
                  speed={200}
                />
                <Navbar />
                <div className="pb-16 md:pb-0">
                  {children}
                </div>
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
