'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PermissionDeniedBanner from '@/components/layout/PermissionDeniedBanner';
import { Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Loading State */}
        {loadingPermission && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              Loading Access Permissions...
            </div>
        )}

        {/* Permission Denied State */}
        {!loadingPermission && userPermission === 'Read' && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '2rem' }}>
                <PermissionDeniedBanner />
            </div>
        )}

        {/* Authorized State: Render Sidebar + Children */}
        {!loadingPermission && userPermission !== 'Read' && (
          <>
            <AdminSidebar />
            <main style={{
              flex: 1, 
              overflowY: 'auto',
              padding: '2rem', 
              backgroundColor: '#f8fafc'
            }}>
              {children}
            </main>
          </>
        )}
      </div>
    </div>
  );
} 