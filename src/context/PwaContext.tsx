'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { haptics } from '@/lib/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isOffline: boolean;
  promptInstall: () => Promise<boolean>;
  showIosGuide: boolean;
  setShowIosGuide: (show: boolean) => void;
  dismissBanner: () => void;
  shouldShowBanner: boolean;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isIos: false,
  isOffline: false,
  promptInstall: async () => false,
  showIosGuide: false,
  setShowIosGuide: () => {},
  dismissBanner: () => {},
  shouldShowBanner: false,
});

const DISMISS_KEY = 'resumecraft_pwa_dismissed_time';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Service Worker Registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Detect Standalone Display Mode (Already Installed)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };
    checkInstalled();

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Check dismissal history
    try {
      const dismissedTime = localStorage.getItem(DISMISS_KEY);
      if (dismissedTime) {
        const timeElapsed = Date.now() - parseInt(dismissedTime, 10);
        setIsDismissed(timeElapsed < DISMISS_DURATION_MS);
      } else {
        setIsDismissed(false);
      }
    } catch (_) {
      setIsDismissed(false);
    }

    // 5. Offline status tracking
    setIsOffline(!navigator.onLine);
    const handleOnline = () => {
      setIsOffline(false);
      haptics.success();
    };
    const handleOffline = () => {
      setIsOffline(true);
      haptics.warning();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 6. Capture beforeinstallprompt (Android Chrome / Desktop Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 7. Track successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      haptics.success();
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch (_) {}
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    haptics.light();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          haptics.success();
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        } else {
          dismissBanner();
          return false;
        }
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        return false;
      }
    } else if (isIos && !isInstalled) {
      setShowIosGuide(true);
      return true;
    }
    return false;
  };

  const dismissBanner = () => {
    haptics.light();
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (_) {}
  };

  const shouldShowBanner =
    !isInstalled &&
    !isDismissed &&
    (Boolean(deferredPrompt) || (isIos && !isInstalled));

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt) || (isIos && !isInstalled),
        isInstalled,
        isIos,
        isOffline,
        promptInstall,
        showIosGuide,
        setShowIosGuide,
        dismissBanner,
        shouldShowBanner,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => useContext(PwaContext);
