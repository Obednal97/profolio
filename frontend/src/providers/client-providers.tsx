'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from './theme-provider';

// Dynamically import AuthProvider to prevent SSR issues
const AuthProvider = dynamic(
  () => import('@/lib/auth').then(mod => ({ default: mod.AuthProvider })),
  {
    ssr: false,
    loading: () => <div className="min-h-screen" /> // Minimal loading state to prevent layout shift
  }
);

// Dynamically import LayoutWrapper to prevent SSR issues
const LayoutWrapper = dynamic(
  () => import('@/components/layout/layoutWrapper'),
  {
    ssr: false,
    loading: () => <div className="min-h-screen">{null}</div>
  }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <LayoutWrapper>{children}</LayoutWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
} 