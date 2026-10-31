'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import {
  SCHEDULE_EVENT,
  DEPENDENCY_MAP_EVENT,
  loadScheduledCourses,
  loadActiveTerm,
  loadVersionsMap,
  hydrateScheduleFromCloud,
  loadDependencyMapStorage,
  hydrateDependencyMapFromCloud,
} from '@/lib/schedule';
import { useDictionary } from './DictionaryProvider';

const LazyAuthMissingConfigDialog = dynamic(
  () => import('./AuthMissingConfigDialog').then((m) => m.AuthMissingConfigDialog),
  { ssr: false }
);

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string;
}

export interface OAuthInfo {
  clientId: string | null;
  hasClientSecret: boolean;
  isConfigured: boolean;
  allowedDomain: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isSyncing: boolean;
  oauth: OAuthInfo;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  syncNow: (showToast?: boolean) => Promise<void>;
}

const DEFAULT_OAUTH: OAuthInfo = {
  clientId: null,
  hasClientSecret: false,
  isConfigured: false,
  allowedDomain: 'post.bgu.ac.il',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
  initialOauth,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
  initialOauth?: OAuthInfo;
}) {
  const { dictionary } = useDictionary();

  const hasHydratedAuth = initialUser !== undefined;
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!hasHydratedAuth);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMissingConfigDialog, setShowMissingConfigDialog] = useState(false);
  const [oauth, setOauth] = useState<OAuthInfo>(initialOauth ?? DEFAULT_OAUTH);

  const userRef = useRef<AuthUser | null>(user);
  userRef.current = user;

  const isPullingRef = useRef(false);
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushToCloud = useCallback(async () => {
    if (!userRef.current || isPullingRef.current) return;
    setIsSyncing(true);
    try {
      const courses = loadScheduledCourses();
      const activeTerm = loadActiveTerm();
      const versionsMap = loadVersionsMap();
      const dependencyMap = loadDependencyMapStorage();

      await fetch('/api/user/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule: { courses, activeTerm, versionsMap },
          dependencyMap,
        }),
      });
    } catch (err) {
      console.error('Failed to push user data to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const pullFromCloud = useCallback(
    async (showSuccessToast = false) => {
      if (!userRef.current) return;
      isPullingRef.current = true;
      setIsSyncing(true);
      try {
        const res = await fetch('/api/user/sync', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        let shouldSeedCloud = false;

        // 1. Sync Weekly Schedule
        if (data.schedule && Array.isArray(data.schedule.courses)) {
          hydrateScheduleFromCloud(
            data.schedule.courses,
            data.schedule.activeTerm,
            data.schedule.versionsMap
          );
        } else if (data.schedule === null) {
          const localCourses = loadScheduledCourses();
          if (localCourses.length > 0) {
            shouldSeedCloud = true;
          } else {
            hydrateScheduleFromCloud([], { year: '2027', semester: '1' });
          }
        }

        // 2. Sync Relation Map (Dependency Map)
        if (data.dependencyMap && Array.isArray(data.dependencyMap.nodes)) {
          hydrateDependencyMapFromCloud(data.dependencyMap);
        } else if (data.dependencyMap === null) {
          const localMap = loadDependencyMapStorage();
          if (localMap.nodes.length > 0 || localMap.edges.length > 0) {
            shouldSeedCloud = true;
          } else {
            hydrateDependencyMapFromCloud({
              nodes: [],
              edges: [],
              selectedRelations: ['קורס קדם'],
            });
          }
        }

        if (shouldSeedCloud) {
          isPullingRef.current = false;
          await pushToCloud();
        }

        if (showSuccessToast) {
          toast.success(dictionary.auth.syncedToast);
        }
      } catch (err) {
        console.error('Failed to pull user data from cloud:', err);
      } finally {
        isPullingRef.current = false;
        setIsSyncing(false);
      }
    },
    [dictionary.auth.syncedToast, pushToCloud]
  );

  // Sync server-provided auth props when router refreshes (e.g. after OAuth redirect)
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      userRef.current = initialUser;
      setIsLoading(false);
    }
    if (initialOauth) {
      setOauth(initialOauth);
    }
  }, [initialUser, initialOauth]);

  // Check session on mount ONLY if not already hydrated from SSR, & handle OAuth callback query parameters
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (hasHydratedAuth) {
        if (userRef.current) {
          await pullFromCloud(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!mounted) return;
          setUser(data.user || null);
          userRef.current = data.user || null;
          if (data.oauth) setOauth(data.oauth);

          if (data.user) {
            await pullFromCloud(false);
          }
        }
      } catch (e) {
        console.error('Failed to fetch auth session:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void initAuth();

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const authError = url.searchParams.get('authError');
      const authSuccess = url.searchParams.get('authSuccess');

      if (authError || authSuccess) {
        if (authError === 'invalid_domain') {
          toast.error(dictionary.auth.invalidDomainToast);
        } else if (authError === 'missing_config') {
          setShowMissingConfigDialog(true);
        } else if (authError && authError !== 'oauth_cancelled') {
          toast.error(dictionary.auth.authErrorToast);
        } else if (authSuccess === '1') {
          toast.success(dictionary.auth.loginSuccessToast);
        }

        url.searchParams.delete('authError');
        url.searchParams.delete('authSuccess');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      }
    }

    return () => {
      mounted = false;
    };
  }, [
    hasHydratedAuth,
    dictionary.auth.authErrorToast,
    dictionary.auth.invalidDomainToast,
    dictionary.auth.loginSuccessToast,
    pullFromCloud,
  ]);

  // Listen to local schedule & dependency map updates and push to cloud (debounced)
  useEffect(() => {
    if (!user) return;

    const schedulePush = () => {
      if (isPullingRef.current) return;
      if (pushTimeoutRef.current) {
        clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = setTimeout(() => {
        void pushToCloud();
      }, 350);
    };

    window.addEventListener(SCHEDULE_EVENT, schedulePush);
    window.addEventListener(DEPENDENCY_MAP_EVENT, schedulePush);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && userRef.current) {
        void pullFromCloud(false);
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener(SCHEDULE_EVENT, schedulePush);
      window.removeEventListener(DEPENDENCY_MAP_EVENT, schedulePush);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (pushTimeoutRef.current) {
        clearTimeout(pushTimeoutRef.current);
      }
    };
  }, [user, pushToCloud, pullFromCloud]);

  const signInWithGoogle = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (oauth.hasClientSecret) {
      const returnTo = window.location.pathname + window.location.search;
      window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }

    if (oauth.clientId) {
      const launchGisPopup = () => {
        const googleObj = (window as any).google;
        if (!googleObj?.accounts?.oauth2) return;
        const tokenClient = googleObj.accounts.oauth2.initTokenClient({
          client_id: oauth.clientId,
          scope: 'openid email profile',
          hosted_domain: 'post.bgu.ac.il',
          prompt: 'select_account',
          callback: async (response: any) => {
            if (response?.access_token) {
              const verifyRes = await fetch('/api/auth/google/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: response.access_token }),
              });
              if (verifyRes.ok) {
                const data = await verifyRes.json();
                setUser(data.user);
                userRef.current = data.user;
                toast.success(dictionary.auth.loginSuccessToast);
                await pullFromCloud(false);
              } else {
                const errData = await verifyRes.json().catch(() => ({}));
                if (errData.error === 'invalid_domain') {
                  toast.error(dictionary.auth.invalidDomainToast);
                } else {
                  toast.error(dictionary.auth.authErrorToast);
                }
              }
            }
          },
        });
        tokenClient.requestAccessToken();
      };

      if ((window as any).google?.accounts?.oauth2) {
        launchGisPopup();
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = launchGisPopup;
        document.head.appendChild(script);
      }
      return;
    }

    setShowMissingConfigDialog(true);
  }, [
    oauth,
    dictionary.auth.authErrorToast,
    dictionary.auth.invalidDomainToast,
    dictionary.auth.loginSuccessToast,
    pullFromCloud,
  ]);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      userRef.current = null;
      toast.info(dictionary.auth.logoutToast);
    } catch (e) {
      console.error('Failed to sign out:', e);
    }
  }, [dictionary.auth.logoutToast]);

  const syncNow = useCallback(
    async (showToast = true) => {
      await pullFromCloud(showToast);
    },
    [pullFromCloud]
  );

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isSyncing,
      oauth,
      signInWithGoogle,
      signOut,
      syncNow,
    }),
    [user, isLoading, isSyncing, oauth, signInWithGoogle, signOut, syncNow]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      {showMissingConfigDialog && (
        <LazyAuthMissingConfigDialog
          open={showMissingConfigDialog}
          onOpenChange={setShowMissingConfigDialog}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
