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
import { Search, Workflow, Database, GraduationCap } from 'lucide-react';
import { useDictionary } from '@/components/providers/DictionaryProvider';

const ONBOARDING_STORAGE_KEY = 'modern_catalog_has_seen_onboarding';

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
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    window.dispatchEvent(new Event('onboarding-completed'));
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md gap-5 p-6"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="space-y-1.5">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-1">
            <GraduationCap className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {dictionary.onboarding.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {dictionary.onboarding.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex gap-3.5 items-start p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 rounded-lg shrink-0 mt-0.5">
              <Search className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {dictionary.onboarding.features.search.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dictionary.onboarding.features.search.desc}
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 rounded-lg shrink-0 mt-0.5">
              <Workflow className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {dictionary.onboarding.features.map.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dictionary.onboarding.features.map.desc}
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2 rounded-lg shrink-0 mt-0.5">
              <Database className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {dictionary.onboarding.features.offline.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dictionary.onboarding.features.offline.desc}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full rounded-xl font-medium h-10">
            {dictionary.onboarding.getStarted}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
