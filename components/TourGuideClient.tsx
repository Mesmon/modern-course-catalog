'use client';

import dynamic from 'next/dynamic';

export const TourGuideClient = dynamic(() => import('@/components/TourGuide').then(mod => mod.TourGuide), { ssr: false });
