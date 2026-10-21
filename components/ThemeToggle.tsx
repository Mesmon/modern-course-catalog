'use client';

import * as React from 'react';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === 'he';

  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on outside click or escape key (mobile touchstart + desktop mousedown)
  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Options configuration
  const themeOptions = [
    {
      value: 'system',
      label: dictionary.theme.system,
      icon: Monitor,
      hint: dictionary.theme.systemHint,
    },
    {
      value: 'light',
      label: dictionary.theme.light,
      icon: Sun,
      hint: null,
    },
    {
      value: 'dark',
      label: dictionary.theme.dark,
      icon: Moon,
      hint: null,
    },
  ] as const;

  const currentTheme = theme || 'system';

  // Render trigger icon based on current selection
  const renderTriggerIcon = () => {
    if (!mounted) {
      return <Sun className="h-4 w-4 opacity-70" />;
    }

    if (currentTheme === 'system') {
      return (
        <span className="relative inline-flex items-center justify-center">
          <Monitor className="h-4 w-4 transition-transform duration-200" />
          <span
            className={cn(
              'absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900',
              resolvedTheme === 'dark' ? 'bg-indigo-500' : 'bg-amber-500'
            )}
            title={resolvedTheme === 'dark' ? dictionary.theme.currentlyDark : dictionary.theme.currentlyLight}
          />
        </span>
      );
    }

    if (currentTheme === 'dark') {
      return <Moon className="h-4 w-4 transition-transform duration-200" />;
    }

    return <Sun className="h-4 w-4 transition-transform duration-200" />;
  };

  const getActiveTooltip = () => {
    if (!mounted) return dictionary.theme.title;
    if (currentTheme === 'system') {
      const activeState = resolvedTheme === 'dark' ? dictionary.theme.currentlyDark : dictionary.theme.currentlyLight;
      return `${dictionary.theme.title}: ${dictionary.theme.system} (${activeState})`;
    }
    return `${dictionary.theme.title}: ${currentTheme === 'dark' ? dictionary.theme.dark : dictionary.theme.light}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={getActiveTooltip()}
        title={getActiveTooltip()}
        className={cn(
          'h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          open && 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
        )}
      >
        {renderTriggerIcon()}
      </button>

      {open && (
        <>
          {/* Subtle mobile backdrop to ensure clean touch-dismiss on mobile screens */}
          <div
            className="fixed inset-0 z-40 sm:hidden bg-black/10 dark:bg-black/30 backdrop-blur-2xs"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            aria-orientation="vertical"
            dir={isRtl ? 'rtl' : 'ltr'}
            className={cn(
              'absolute top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md shadow-xl p-2 z-50 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150',
              isRtl ? 'left-0 text-right' : 'right-0 text-left'
            )}
          >
            {/* Menu Header */}
            <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {dictionary.theme.title}
              </span>
              {mounted && currentTheme === 'system' && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  {resolvedTheme === 'dark' ? dictionary.theme.currentlyDark : dictionary.theme.currentlyLight}
                </span>
              )}
            </div>

            {/* Theme Options */}
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = mounted && currentTheme === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full min-h-[44px] sm:min-h-[40px] px-3 py-2 rounded-lg flex items-center gap-3 text-start transition-all cursor-pointer active:scale-[0.98]',
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-primary border border-orange-200/90 dark:border-orange-800/70 font-semibold shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm truncate">
                        {opt.label}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                    {opt.hint && (
                      <p className="text-[10px] text-muted-foreground font-normal leading-tight mt-0.5 line-clamp-1">
                        {opt.hint}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
