'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import PermissionDeniedBanner from './PermissionDeniedBanner';
import { getBaseUrl } from '@/utils/urlUtils';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: 'Admin' | 'Edit'; // Permissions that allow access
  fallback?: ReactNode; // Optional custom fallback UI
}

/**
 * PermissionGuard - Only renders its children if the user has the required permissions
 * Otherwise shows the PermissionDeniedBanner or custom fallback
 */
export default function PermissionGuard({ 
  children, 
  requiredPermission,
  fallback 
}: PermissionGuardProps) {
  const { data: session, status } = useSession();
  const [userPermission, setUserPermission] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermission() {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/user/permissions');
          
          if (response.status === 401) {
            console.log("Server reports user is not authenticated, signing out...");
            await signOut({ redirect: true, callbackUrl: `${getBaseUrl()}/auth/login-signup` });
            return;
          }
          
          if (!response.ok) {
            throw new Error('Failed to fetch permissions');
          }
          
          const data = await response.json();
          setUserPermission(data.permissionName);
        } catch (error) {
          console.error("Error fetching permissions:", error);
          setUserPermission('Read'); // Default to Read on error
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        // Redirect unauthenticated users to login
        window.location.href = `${getBaseUrl()}/auth/login-signup`;
      }
    }

    fetchPermission();
  }, [status]);

  // While loading permissions
  if (loading || status === 'loading') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading permissions...</div>;
  }

  // Check if user has required permission
  const hasPermission = userPermission === requiredPermission || userPermission === 'Admin';
  
  // Render children only if user has required permission
  if (hasPermission) {
    return <>{children}</>;
  }
  
  // Otherwise show fallback or default permission denied banner
  return fallback || <PermissionDeniedBanner />;
} 