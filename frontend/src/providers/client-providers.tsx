'use client';

import React from 'react';
import { ThemeProvider } from './theme-provider';
import { UnifiedAuthProvider } from '@/lib/unifiedAuth';
import LayoutWrapper from '@/components/layout/layoutWrapper';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <UnifiedAuthProvider>
        <LayoutWrapper>{children}</LayoutWrapper>
      </UnifiedAuthProvider>
    </ThemeProvider>
  );
} 