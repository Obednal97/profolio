'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './theme-provider';
import { UnifiedAuthProvider } from '@/lib/unifiedAuth';
import LayoutWrapper from '@/components/layout/layoutWrapper';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount: number, error: unknown) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const httpError = error as { status: number };
          if (httpError.status === 401 || httpError.status === 403) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
        Honours the operating system's "reduce motion" setting across all 45
        components that animate with Framer Motion.

        The stylesheet has a `prefers-reduced-motion` block and it does not
        cover them: Framer Motion animates by writing inline styles frame by
        frame, which no CSS rule can stop, and the two selectors that block
        aimed at animated elements - `[class*="motion-"]` and
        `[data-framer-motion]` - match nothing. The attribute is a Framer
        Motion v2 marker and this project is on v13; measured on the live
        site, both selectors match zero elements on the page.

        "user" defers to the OS rather than forcing anything.
      */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider defaultTheme="system">
          <UnifiedAuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </UnifiedAuthProvider>
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
} 