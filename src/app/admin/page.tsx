'use client';

import React from 'react';
import { LayoutDashboard } from 'lucide-react'; // Example icon

export default function AdminDashboardPage() {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <LayoutDashboard size={28} style={{ color: '#0F3460', marginRight: '1rem' }} />
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 'bold',
          color: '#0F3460',
          margin: 0
        }}>Admin Dashboard</h1>
      </div>
      <p style={{ color: '#4b5563' }}>Welcome to the admin dashboard. Use the sidebar to navigate.</p>
      {/* Add dashboard widgets or content here later */}
    </div>
  );
} 