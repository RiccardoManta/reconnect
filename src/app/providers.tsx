'use client'; // This component needs to be a client component

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { PermissionProvider } from '@/contexts/PermissionContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // No need to pass session prop here in App Router
  return (
    <SessionProvider>
      <PermissionProvider>
        {children}
      </PermissionProvider>
    </SessionProvider>
  );
} 