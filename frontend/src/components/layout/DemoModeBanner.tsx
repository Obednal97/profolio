'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, AlertTriangle, User, ArrowRight } from 'lucide-react';

interface DemoModeBannerProps {
  onDismiss?: () => void;
}

export default function DemoModeBanner({ onDismiss }: DemoModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                <span className="hidden sm:inline">Demo Mode: </span>
                Changes and data are not saved. Experience the full platform by creating your account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <Link
              href="/auth/signUp"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up Free</span>
              <span className="sm:hidden">Sign Up</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 