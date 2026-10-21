'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Search,
  Workflow,
  Calendar,
  Cloud,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useDictionary } from '@/components/providers/DictionaryProvider';

const ONBOARDING_STORAGE_KEY = 'modern_catalog_has_seen_onboarding';

export function HelpTourButton() {
  const { dictionary } = useDictionary();

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-onboarding-dialog'))}
      title={dictionary.onboarding.helpTooltip}
      aria-label={dictionary.onboarding.helpTooltip}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-primary/60 hover:text-primary transition-colors cursor-pointer"
    >
      <HelpCircle className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { dictionary, locale } = useDictionary();
  const isRtl = locale === 'he';

  useEffect(() => {
    setMounted(true);
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }

    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-onboarding-dialog', handleOpen);
    return () => window.removeEventListener('open-onboarding-dialog', handleOpen);
  }, []);

  const handleStartTour = () => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    // Clear current page tour flags so the interactive spotlight tour runs even if re-triggered
    localStorage.removeItem('modern_catalog_tour_home');
    localStorage.removeItem('modern_catalog_tour_schedule');
    localStorage.removeItem('modern_catalog_tour_map');
    window.dispatchEvent(new Event('onboarding-completed'));
  };

  const handleSkipTour = () => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    localStorage.setItem('modern_catalog_tour_home', 'true');
    localStorage.setItem('modern_catalog_tour_schedule', 'true');
    localStorage.setItem('modern_catalog_tour_map', 'true');
  };

  if (!mounted) return null;

  const features = [
    {
      icon: Search,
      chip: '⌘K · #202',
      title: dictionary.onboarding.features.search.title,
      desc: dictionary.onboarding.features.search.desc,
    },
    {
      icon: Calendar,
      chip: 'Google / .ics',
      title: dictionary.onboarding.features.schedule.title,
      desc: dictionary.onboarding.features.schedule.desc,
    },
    {
      icon: Workflow,
      chip: 'L ➔ R DAG',
      title: dictionary.onboarding.features.map.title,
      desc: dictionary.onboarding.features.map.desc,
    },
    {
      icon: Cloud,
      chip: '@post.bgu.ac.il',
      title: dictionary.onboarding.features.cloudSync.title,
      desc: dictionary.onboarding.features.cloudSync.desc,
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleSkipTour();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl gap-5 p-5 sm:p-6 border-slate-200 dark:border-slate-800"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="space-y-2 text-start">
          <div className="inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 text-primary font-mono text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>{dictionary.onboarding.badge}</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {dictionary.onboarding.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {dictionary.onboarding.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between gap-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span
                    dir="ltr"
                    className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {item.chip}
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkipTour}
            className="w-full sm:w-auto text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {dictionary.onboarding.skipTour}
          </Button>
          <Button
            type="button"
            onClick={handleStartTour}
            className="w-full sm:w-auto rounded-lg font-semibold text-xs h-9 px-4 gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{dictionary.onboarding.getStarted}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
