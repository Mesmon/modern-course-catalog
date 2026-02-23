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
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`; // 1 year expiration
    router.refresh();
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleLanguage}
      className="text-slate-600 hover:text-primary relative"
      aria-label="Toggle language"
    >
      <Globe className="h-5 w-5" />
      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-slate-100 rounded-sm px-1 leading-none pt-[2px]">
        {locale === 'en' ? 'HE' : 'EN'}
      </span>
    </Button>
  );
}
