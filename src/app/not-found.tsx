'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center space-y-4 p-8">
        <div className="w-12 h-12 rounded-full bg-[#F0F7FF] text-[#0066CC] flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1D1D1F]">Page Not Found</h2>
          <p className="text-xs text-[#555555] mt-1">
            The requested page does not exist or has been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button size="sm" pill>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
