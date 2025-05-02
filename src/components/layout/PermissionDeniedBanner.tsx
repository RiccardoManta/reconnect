'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react'; // Or another appropriate icon

interface PermissionDeniedBannerProps {
  message?: string;
}

const PermissionDeniedBanner: React.FC<PermissionDeniedBannerProps> = ({ 
  message = "Error: Requires higher privileges to access this section." 
}) => {
  return (
    <div style={{
      padding: '1rem 1.5rem',
      margin: '2rem', // Add some margin around the banner
      backgroundColor: '#fee2e2', // Light red background
      color: '#b91c1c',       // Dark red text
      borderRadius: '0.5rem',
      fontSize: '0.9rem',
      border: '1px solid #fca5a5', // Lighter red border
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // Center content
      gap: '0.75rem'
    }}>
      <ShieldAlert size={20} /> 
      <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
    </div>
  );
};

export default PermissionDeniedBanner; 