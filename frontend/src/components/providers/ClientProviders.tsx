'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 