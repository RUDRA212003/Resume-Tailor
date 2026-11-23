'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E5E5E7] rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            ⚠️
          </div>
          <h2 className="text-base font-bold text-[#1D1D1F]">
            Application Encountered an Error
          </h2>
          <p className="text-xs text-[#555555]">
            {error.message || 'A critical error occurred. Please reload the application.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-medium bg-[#0066CC] text-white rounded-lg hover:bg-[#0055b3]"
          >
            Reload Studio
          </button>
        </div>
      </body>
    </html>
  );
}
