import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { LoginPromptModal } from '@/components/auth/LoginPromptModal';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeCraft – AI Resume Tailoring Studio',
  description:
    'Intelligent, evidence-based resume tailoring studio. Tailors resumes to job descriptions with guaranteed factual accuracy and zero hallucinations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#0066CC]/20 selection:text-[#0066CC]" suppressHydrationWarning>
        <Auth0Provider>
          <AuthModalProvider>
            {children}
            <LoginPromptModal />
          </AuthModalProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
