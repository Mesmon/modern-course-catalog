'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useDictionary } from './providers/DictionaryProvider';

export function TourGuide({ page }: { page: 'home' | 'schedule' | 'map' }) {
  const { dictionary } = useDictionary();

  useEffect(() => {
    const storageKey = `modern_catalog_tour_${page}`;

    // The function that initializes and drives the tour
    const initializeTour = (force = false) => {
      if (!force && localStorage.getItem(storageKey)) return;

      // Delay slightly to ensure target elements are rendered and animations settle
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        const candidateSteps: DriveStep[] = [];

        if (page === 'home') {
          candidateSteps.push(
            {
              element: '#tour-search',
              popover: {
                title: dictionary.tour.home.searchTitle,
                description: dictionary.tour.home.searchDesc,
                side: 'bottom',
                align: 'start',
              },
            },
            {
              element: '#tour-global-search',
              popover: {
                title: dictionary.tour.home.globalSearchTitle,
                description: dictionary.tour.home.globalSearchDesc,
                side: 'bottom',
                align: 'center',
              },
            },
            {
              element:
                isMobile && document.getElementById('tour-schedule-link-mobile')
                  ? '#tour-schedule-link-mobile'
                  : '#tour-schedule-link',
              popover: {
                title: dictionary.tour.home.scheduleTitle,
                description: dictionary.tour.home.scheduleDesc,
                side: isMobile ? 'top' : 'bottom',
                align: 'start',
              },
            },
            {
              element:
                isMobile && document.getElementById('tour-map-link-mobile')
                  ? '#tour-map-link-mobile'
                  : '#tour-map-link',
              popover: {
                title: dictionary.tour.home.mapTitle,
                description: dictionary.tour.home.mapDesc,
                side: isMobile ? 'top' : 'bottom',
                align: 'start',
              },
            },
            {
              element: '#tour-auth-menu',
              popover: {
                title: dictionary.tour.home.authTitle,
                description: dictionary.tour.home.authDesc,
                side: 'bottom',
                align: 'end',
              },
            },
            {
              element: '#tour-full-catalog',
              popover: {
                title: dictionary.tour.home.catalogTitle,
                description: dictionary.tour.home.catalogDesc,
                side: 'top',
                align: 'start',
              },
            }
          );
        } else if (page === 'schedule') {
          candidateSteps.push(
            {
              element: '#tour-schedule-term',
              popover: {
                title: dictionary.tour.schedule.termTitle,
                description: dictionary.tour.schedule.termDesc,
                side: 'bottom',
                align: 'start',
              },
            },
            {
              element: '#tour-schedule-add',
              popover: {
                title: dictionary.tour.schedule.addTitle,
                description: dictionary.tour.schedule.addDesc,
                side: 'bottom',
                align: 'end',
              },
            },
            {
              element: '#tour-schedule-sidebar',
              popover: {
                title: dictionary.tour.schedule.sidebarTitle,
                description: dictionary.tour.schedule.sidebarDesc,
                side: isMobile ? 'top' : 'left',
                align: 'start',
              },
            },
            {
              element: '#tour-schedule-grid',
              popover: {
                title: dictionary.tour.schedule.gridTitle,
                description: dictionary.tour.schedule.gridDesc,
                side: 'top',
                align: 'center',
              },
            }
          );
        } else if (page === 'map') {
          candidateSteps.push(
            {
              element: '#tour-map-add',
              popover: {
                title: dictionary.tour.map.searchTitle,
                description: dictionary.tour.map.searchDesc,
                side: 'bottom',
                align: 'start',
              },
            },
            {
              element: '#tour-map-layout',
              popover: {
                title: dictionary.tour.map.addTitle,
                description: dictionary.tour.map.addDesc,
                side: 'bottom',
                align: 'start',
              },
            },
            {
              element: '#tour-map-area',
              popover: {
                title: dictionary.tour.map.canvasTitle,
                description: dictionary.tour.map.canvasDesc,
                side: 'top',
                align: 'center',
              },
            }
          );
        }

        // Only keep steps whose target element exists and is visible in the DOM
        const validSteps = candidateSteps.filter((step) => {
          if (typeof step.element !== 'string') return false;
          const el = document.querySelector(step.element) as HTMLElement | null;
          return Boolean(el && el.offsetParent !== null);
        });

        if (validSteps.length === 0) return;

        const driverObj = driver({
          showProgress: true,
          animate: true,
          smoothScroll: true,
          stagePadding: 6,
          stageRadius: 10,
          popoverClass: 'bgu-tour-popover',
          progressText: dictionary.tour.progressText,
          nextBtnText: dictionary.tour.next,
          prevBtnText: dictionary.tour.prev,
          doneBtnText: dictionary.tour.done,
          steps: validSteps,
          onDestroyStarted: () => {
            driverObj.destroy();
            localStorage.setItem(storageKey, 'true');
          },
        });

        driverObj.drive();
      }, 450);
    };

    const hasSeenTour = localStorage.getItem(storageKey);
    const hasSeenOnboarding = localStorage.getItem('modern_catalog_has_seen_onboarding');

    // If onboarding was already completed previously and this page's tour hasn't run yet, launch it
    if (hasSeenOnboarding && !hasSeenTour) {
      initializeTour(false);
    }

    // Always listen for 'onboarding-completed' so clicking "Start Interactive Tour" from the
    // welcome dialog (or re-opening via the Navbar '?' button) launches the tour immediately
    const handleOnboardingCompleted = () => {
      initializeTour(true);
    };

    window.addEventListener('onboarding-completed', handleOnboardingCompleted);
    return () => window.removeEventListener('onboarding-completed', handleOnboardingCompleted);
  }, [page, dictionary]);

  return null;
}
