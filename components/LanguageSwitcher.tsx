'use client';

import { Button } from '@/components/ui/button';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const { locale } = useDictionary();
  const router = useRouter();

  const toggleLanguage = () => {
    const nextLocale = locale === 'he' ? 'en' : 'he';
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-9 px-2 sm:px-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 gap-1.5 text-xs font-semibold sm:font-medium cursor-pointer"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5 hidden sm:block" />
      <span>{locale === 'en' ? 'עב' : 'EN'}</span>
    </Button>
  );
}
