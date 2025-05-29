// /app/app/client-layout.tsx (CLIENT component)
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { initializeDemoData } from '@/lib/demoData';

// DEVELOPMENT: Authentication imports commented out for testing
// import { useUser } from "@/lib/user";
// import type { User } from '@/types/global';
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';

  useEffect(() => {
    // Initialize demo data if in demo mode
    if (isDemoMode && typeof window !== 'undefined') {
      initializeDemoData();
    }
  }, [isDemoMode]);

  useEffect(() => {
    // Only redirect if not loading and no user and not in demo mode
    if (!loading && !user && !isDemoMode) {
      router.push('/auth/signIn');
    }
  }, [user, loading, isDemoMode, router]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#101828]">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Don't render if no user and not in demo mode
  if (!user && !isDemoMode) {
    return null;
  }

  return <>{children}</>;
}