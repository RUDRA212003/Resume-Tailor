'use client';

import React, { createContext, useContext, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export interface AuthModalContextType {
  isOpen: boolean;
  targetHref: string;
  featureName: string;
  requireAuth: (targetHref?: string, featureName?: string) => boolean;
  openLoginPrompt: (targetHref?: string, featureName?: string) => void;
  closeLoginPrompt: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [targetHref, setTargetHref] = useState('/dashboard');
  const [featureName, setFeatureName] = useState('this feature');

  const openLoginPrompt = (href = '/dashboard', feature = 'this feature') => {
    setTargetHref(href);
    setFeatureName(feature);
    setIsOpen(true);
  };

  const closeLoginPrompt = () => {
    setIsOpen(false);
  };

  const requireAuth = (href = '/dashboard', feature = 'this feature'): boolean => {
    if (user) {
      return true;
    }
    openLoginPrompt(href, feature);
    return false;
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        targetHref,
        featureName,
        requireAuth,
        openLoginPrompt,
        closeLoginPrompt,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = (): AuthModalContextType => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    return {
      isOpen: false,
      targetHref: '/dashboard',
      featureName: 'this feature',
      requireAuth: (href = '/dashboard') => {
        if (typeof window !== 'undefined') {
          window.location.href = `/auth/login?returnTo=${encodeURIComponent(href)}`;
        }
        return false;
      },
      openLoginPrompt: (href = '/dashboard') => {
        if (typeof window !== 'undefined') {
          window.location.href = `/auth/login?returnTo=${encodeURIComponent(href)}`;
        }
      },
      closeLoginPrompt: () => {},
    };
  }
  return ctx;
};
