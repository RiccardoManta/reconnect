'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Users, ShieldCheck } from 'lucide-react';

const adminNavItems = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Groups', href: '/admin/groups', icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px',
          backgroundColor: '#eef2f6', // Lighter sidebar background
          borderRight: '1px solid #d1d5db', // Subtle border
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                    <Link href={item.href} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem', // Similar to cards
                      textDecoration: 'none',
                      color: isActive ? '#0F3460' : '#4b5563', // Dark blue active, gray inactive
                      backgroundColor: isActive ? '#dbeafe' : 'transparent', // Light blue background active
                      fontWeight: isActive ? '600' : 'normal',
                      transition: 'background-color 0.2s ease, color 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'; // Light gray hover
                        e.currentTarget.style.color = '#111827'; // Darker text on hover
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#4b5563';
                      }
                    }}
                    >
                      <item.icon size={18} style={{ marginRight: '0.75rem' }} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '2rem', 
          backgroundColor: '#f8fafc', // Same as database page content area
          overflowY: 'auto' // Ensure content scrolls if it overflows
        }}>
          {children}
        </main>
      </div>
    </div>
  );
} 