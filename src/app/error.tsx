'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center space-y-4 p-8">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1D1D1F]">
            Something went wrong
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>
        <div className="pt-2">
          <Button
            size="sm"
            onClick={() => reset()}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
