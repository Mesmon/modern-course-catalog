'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useDictionary } from '@/components/providers/DictionaryProvider';
import { Button } from '@/components/ui/button';
import { Cloud, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.275c0-.85-.075-1.665-.215-2.45H12v4.635h6.445c-.28 1.495-1.125 2.76-2.395 3.61v3h3.875c2.265-2.085 3.565-5.16 3.565-8.795z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3c-1.075.72-2.45 1.145-4.065 1.145-3.125 0-5.77-2.11-6.715-4.945H1.275v3.095C3.25 21.305 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.285 14.29c-.24-.72-.375-1.49-.375-2.29s.135-1.57.375-2.29V6.615H1.275C.465 8.23 0 10.06 0 12s.465 3.77 1.275 5.385l4.01-3.095z"
      />
      <path
        fill="#EA4335"
        d="M12 4.765c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.25 2.695 1.275 6.615l4.01 3.095C6.23 6.875 8.875 4.765 12 4.765z"
      />
    </svg>
  );
}

export function UserAuthMenu() {
  const { user, isLoading, isSyncing, signInWithGoogle, signOut, syncNow } = useAuth();
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === 'he';
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-9 w-24 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={signInWithGoogle}
        title={dictionary.auth.signInSubtitle}
        className="h-9 px-3 rounded-lg font-medium gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs shadow-xs cursor-pointer"
      >
        <GoogleLogo className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden lg:inline">{dictionary.auth.signInWithGoogle}</span>
        <span className="lg:hidden">BGU</span>
      </Button>
    );
  }

  const initials = (user.name || user.email)
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(prev => !prev)}
        className="flex items-center gap-2 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 transition-colors cursor-pointer shadow-xs"
        title={`${user.name} (${user.email})`}
      >
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt={user.name}
            className="h-5 w-5 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {initials}
          </div>
        )}
        <span className="text-xs font-medium text-foreground hidden md:inline max-w-[100px] truncate">
          {user.name}
        </span>
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        ) : (
          <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
      </button>

      {menuOpen && (
        <div
          className={cn(
            'absolute top-full mt-1.5 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-3.5 z-50 space-y-3 animate-in fade-in-0 zoom-in-95 duration-150',
            isRtl ? 'left-0 text-right' : 'right-0 text-left'
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            {user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </p>
              <p className="text-xs font-mono text-muted-foreground truncate" dir="ltr">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isSyncing ? dictionary.auth.syncing : dictionary.auth.cloudSynced}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncing}
              onClick={() => {
                syncNow(true);
                setMenuOpen(false);
              }}
              className="flex-1 h-8 rounded-lg font-medium gap-1.5 text-xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
              {dictionary.auth.syncNow}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="h-8 rounded-lg font-medium gap-1.5 text-xs text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              {dictionary.auth.signOut}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
