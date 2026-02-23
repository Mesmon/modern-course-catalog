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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Course Catalog",
  description: "Modern course catalog",
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
      <body className={`${inter.className} min-h-screen bg-background antialiased selection:bg-primary/20`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <DictionaryProvider dictionary={dictionary} locale={locale}>
            <QueryProvider>
              <NextTopLoader 
                color="#059669"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #059669,0 0 5px #059669"
              />
              <Navbar />
              {children}
              <OnboardingDialog />

              <Toaster 
                position="top-center" 
                toastOptions={{
                  classNames: {
                    toast: "bg-white border-2 border-emerald-500 shadow-2xl rounded-[1.5rem] p-6 !w-fit !mx-auto min-w-[300px] flex items-center justify-center gap-4",
                    title: "!text-2xl md:!text-3xl font-black !text-emerald-500 block w-full text-center",
                    description: "!text-emerald-500",
                    icon: "!w-10 !h-10 !text-emerald-500",
                  },
                  duration: 4000
                }}
              />
            </QueryProvider>
          </DictionaryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
