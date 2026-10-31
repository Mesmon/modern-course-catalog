'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const LazyTourGuide = dynamic(
  () => import('@/components/TourGuide').then((mod) => mod.TourGuide),
  { ssr: false }
);

export function TourGuideClient({ page }: { page: 'home' | 'schedule' | 'map' }) {
  const [shouldLoadTour, setShouldLoadTour] = useState(false);

  useEffect(() => {
    const storageKey = `modern_catalog_tour_${page}`;
    const hasSeenTour = localStorage.getItem(storageKey);
    const hasSeenOnboarding = localStorage.getItem('modern_catalog_has_seen_onboarding');

    if (hasSeenOnboarding && !hasSeenTour) {
      setShouldLoadTour(true);
    }

    const handleOnboardingCompleted = () => {
      setShouldLoadTour(true);
    };

    window.addEventListener('onboarding-completed', handleOnboardingCompleted);
    return () => window.removeEventListener('onboarding-completed', handleOnboardingCompleted);
  }, [page]);

  if (!shouldLoadTour) return null;

  return <LazyTourGuide page={page} />;
}
