'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollToTopButtonProps {
  label: string;
}

const SCROLL_STATE_CSS = `
@supports (container-type: scroll-state) {
  @container scroll-state(scrollable: top) {
    .back-to-top {
      visibility: visible;
      opacity: 1;
      translate: 0 0;
    }
  }
}
`;

export function ScrollToTopButton({ label }: ScrollToTopButtonProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Advanced fallback for browsers without CSS container scroll-state queries
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsScrolled(!entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SCROLL_STATE_CSS }} />
      {/* Sentinel element placed at the top of the page */}
      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />

      <button
        type="button"
        onClick={handleScrollToTop}
        className={cn(
          'back-to-top fixed bottom-20 md:bottom-6 end-4 sm:end-6 z-30 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-primary/70 text-slate-900 dark:text-slate-100 hover:text-primary shadow-md hover:shadow-lg text-xs font-semibold cursor-pointer active:scale-95',
          isScrolled && 'is-scrolled'
        )}
      >
        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span>{label}</span>
      </button>
    </>
  );
}
