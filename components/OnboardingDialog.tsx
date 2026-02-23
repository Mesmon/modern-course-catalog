'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Map, Database, Sparkles } from 'lucide-react';
import { useDictionary } from '@/components/providers/DictionaryProvider';

const ONBOARDING_STORAGE_KEY = 'modern_catalog_has_seen_onboarding';

export function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { dictionary } = useDictionary();

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
      <DialogContent className="max-w-md gap-6 p-6">
        <DialogHeader className="space-y-4">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-slate-100">
            {dictionary.onboarding.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base text-slate-600 dark:text-slate-400">
            {dictionary.onboarding.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4 items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl mt-1 shrink-0">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{dictionary.onboarding.features.search.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{dictionary.onboarding.features.search.desc}</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl mt-1 shrink-0">
              <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{dictionary.onboarding.features.map.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{dictionary.onboarding.features.map.desc}</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl mt-1 shrink-0">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{dictionary.onboarding.features.offline.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{dictionary.onboarding.features.offline.desc}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={handleClose} size="lg" className="w-full rounded-xl font-bold text-base h-12">
            {dictionary.onboarding.getStarted}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
