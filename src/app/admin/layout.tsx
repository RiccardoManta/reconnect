'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PermissionDeniedBanner from '@/components/layout/PermissionDeniedBanner';
import { Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import { getBaseUrl } from '@/utils/urlUtils';

const adminNavItems = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Groups', href: '/admin/groups', icon: ShieldCheck },
];

// Define PermissionLevel type (can be shared)
type PermissionLevel = 'Admin' | 'Edit' | 'Read';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [loadingPermission, setLoadingPermission] = useState(true);
  const [userPermission, setUserPermission] = useState<PermissionLevel>('Read');
  const pathname = usePathname();

  useEffect(() => {
    async function fetchPermission() {
      if (sessionStatus === 'authenticated') {
        setLoadingPermission(true);
        try {
          const response = await fetch('/api/user/permissions');
          
          if (response.status === 401) {
            // User is not authenticated according to the server
            console.log("Server reports user is not authenticated in admin layout, signing out...");
            await signOut({ redirect: true, callbackUrl: `${getBaseUrl()}/auth/login-signup` });
            return;
          }
          
          if (!response.ok) {
            throw new Error('Failed to fetch permissions');
          }
          
          const data = await response.json();
          setUserPermission(data.permissionName || 'Read');
        } catch (error) {
          console.error("Error fetching user permission for Admin layout:", error);
          setUserPermission('Read');
        }
        setLoadingPermission(false);
      } else if (sessionStatus === 'unauthenticated') {
        setUserPermission('Read');
        setLoadingPermission(false);
      }
    }
    fetchPermission();
  }, [sessionStatus]);

  // Loading state
  if (loadingPermission) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Loading Access Permissions...
        </div>
      </div>
    );
  }

  // Permission denied state - only show header and error message
  if (userPermission !== 'Admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <PermissionDeniedBanner />
        </div>
      </div>
    );
  }

  // Authorized state - show everything
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <AdminSidebar />
        <main style={{
          flex: 1, 
          overflowY: 'auto',
          padding: '2rem', 
          backgroundColor: '#f8fafc'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
} 