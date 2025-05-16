'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PermissionContextType {
  permissionName: string | null;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  
  // Correctly access permissionName from the augmented session type
  // The type augmentation in [...nextauth].ts should make session.user.permissionName available
  const permissionName = session?.user?.permissionName || null;

  // Debug log
  // React.useEffect(() => {
  //   if (!isLoading) {
  //     console.log('PermissionContext: Session status:', status, 'permissionName:', permissionName);
  //   }
  // }, [session, status, permissionName, isLoading]);

  return (
    <PermissionContext.Provider value={{ permissionName, isLoading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}; 