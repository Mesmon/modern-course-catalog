'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useDictionary } from './providers/DictionaryProvider';

export function TourGuide({ page }: { page: 'home' | 'map' }) {
  const { dictionary } = useDictionary();

  useEffect(() => {
    const storageKey = `modern_catalog_tour_${page}`;
    const hasSeenTour = localStorage.getItem(storageKey);
    const hasSeenOnboarding = localStorage.getItem('modern_catalog_has_seen_onboarding');

    // If the tour was already seen, do nothing.
    if (hasSeenTour) return;

    // The function that actually initializes the tour
    const initializeTour = () => {
      // Delay slightly to ensure elements are rendered 
      setTimeout(() => {
        let steps: any[] = [];

        if (page === 'home') {
          if (!document.getElementById('tour-search')) return;

          steps = [
            {
              element: '#tour-search',
              popover: {
                title: dictionary.tour.home.searchTitle,
                description: dictionary.tour.home.searchDesc,
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '#tour-map-link',
              popover: {
                title: dictionary.tour.home.mapTitle,
                description: dictionary.tour.home.mapDesc,
                side: 'bottom',
                align: 'start'
              }
            },
            {
              element: '#tour-full-catalog',
              popover: {
                title: dictionary.tour.home.catalogTitle,
                description: dictionary.tour.home.catalogDesc,
                side: 'top',
                align: 'start'
              }
            }
          ];
        } else if (page === 'map') {
            if (!document.getElementById('tour-map-add')) return;

            steps = [
                {
                    element: '#tour-map-add',
                    popover: {
                        title: dictionary.tour.map.searchTitle,
                        description: dictionary.tour.map.searchDesc,
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#tour-map-area',
                    popover: {
                        title: dictionary.tour.map.canvasTitle,
                        description: dictionary.tour.map.canvasDesc,
                        side: 'top',
                        align: 'center'
                    }
                }
            ];
        }

        if (steps.length === 0) return;

        const driverObj = driver({
          showProgress: true,
          progressText: dictionary.tour.progressText,
          nextBtnText: dictionary.tour.next,
          prevBtnText: dictionary.tour.prev,
          doneBtnText: dictionary.tour.done,
          steps: steps,
          onDestroyStarted: () => {
              if (driverObj.hasNextStep()) {
                  driverObj.destroy();
              } else {
                  driverObj.destroy();
              }
              // Mark as seen when destroyed (completed or skipped)
              localStorage.setItem(storageKey, 'true');
          }
        });

        driverObj.drive();
      }, 500); // 500ms delay to allow page transition and animations
    };

    // If onboarding has already been seen in a previous session, start the tour.
    // Otherwise, wait for the user to close the onboarding dialog.
    if (hasSeenOnboarding) {
        initializeTour();
    } else {
        const handleOnboardingCompleted = () => {
            initializeTour();
        };

        window.addEventListener('onboarding-completed', handleOnboardingCompleted);
        
        return () => window.removeEventListener('onboarding-completed', handleOnboardingCompleted);
    }
  }, [page, dictionary]);

  return null; // This component doesn't render anything itself
}
