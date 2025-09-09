'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme-provider';
import { UnifiedAuthProvider } from '@/lib/unifiedAuth';
import LayoutWrapper from '@/components/layout/layoutWrapper';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <UnifiedAuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </UnifiedAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} 