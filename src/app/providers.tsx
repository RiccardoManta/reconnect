'use client'; // This component needs to be a client component

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // No need to pass session prop here in App Router
  return <SessionProvider>{children}</SessionProvider>;
} 