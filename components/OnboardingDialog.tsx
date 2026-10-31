'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HelpCircle } from 'lucide-react';
import { useDictionary } from '@/components/providers/DictionaryProvider';

const LazyOnboardingDialogContent = dynamic(
  () => import('./OnboardingDialogContent').then((m) => m.OnboardingDialogContent),
  { ssr: false }
);

export function HelpTourButton() {
  const { dictionary } = useDictionary();

  return (
    <button
      type="button"
      onPointerEnter={() => void import('./OnboardingDialogContent')}
      onFocus={() => void import('./OnboardingDialogContent')}
      onClick={() => window.dispatchEvent(new Event('open-onboarding-dialog'))}
      title={dictionary.onboarding.helpTooltip}
      aria-label={dictionary.onboarding.helpTooltip}
      className="inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-primary/60 hover:text-primary transition-colors cursor-pointer"
    >
      <HelpCircle className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setHasTriggered(true);
      setIsOpen(true);
    };
    window.addEventListener('open-onboarding-dialog', handleOpen);
    return () => window.removeEventListener('open-onboarding-dialog', handleOpen);
  }, []);

  if (!hasTriggered) return null;

  return <LazyOnboardingDialogContent isOpen={isOpen} setIsOpen={setIsOpen} />;
}
