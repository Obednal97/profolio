'use client';

import React from 'react';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/lib/auth';
import LayoutWrapper from '@/components/layout/layoutWrapper';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <LayoutWrapper>{children}</LayoutWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
} 