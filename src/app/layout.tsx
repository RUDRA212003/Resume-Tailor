import type { Metadata, Viewport } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { PwaProvider } from '@/context/PwaContext';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { LoginPromptModal } from '@/components/auth/LoginPromptModal';
import { IntroAnimation } from '@/components/intro/IntroAnimation';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'Resume Tailor',
  title: 'Resume Tailor – AI Resume Tailoring Studio',
  description:
    'Intelligent, evidence-based resume tailoring studio. Tailors resumes to job descriptions with guaranteed factual accuracy and zero hallucinations.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Resume Tailor',
  },
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0066CC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full max-w-full overflow-x-hidden" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#0066CC]/20 selection:text-[#0066CC] min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden" suppressHydrationWarning>
        <Auth0Provider>
          <AuthModalProvider>
            <PwaProvider>
              <IntroAnimation />
              {children}
              <LoginPromptModal />
              <PwaInstallBanner />
            </PwaProvider>
          </AuthModalProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
