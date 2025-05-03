'use client'; // Make this a client component

import React, { useState, useRef, useEffect } from 'react';
import { 
    Search, User, Settings, Database, BookOpen, Shield, LogOut, UserCircle, 
    Network, // Added for Connect
    CalendarDays, // Added for Bookings
    Activity, // Added for Activities
    FlaskConical // Added for Testautomation
} from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Common style for nav links
  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
      display: 'inline-flex', // Use flex to align icon and text
      alignItems: 'center', // Vertically align icon and text
      gap: '0.5rem', // Space between icon and text
      background: 'none',
      border: 'none',
      color: isActive ? 'white' : 'rgba(255,255,255,0.75)',
      fontSize: '0.95rem', // Slightly increased font size
      fontWeight: isActive ? '600' : 'normal',
      padding: '0.5rem 0.75rem',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s ease',
      textDecoration: 'none' // Ensure no underline for Links
  });
  
  // Style for the active underline
  const activeUnderlineStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-2px',
    left: '50%',
    transform: 'translateX(-50%)',
    height: '3px',
    width: '40%',
    backgroundColor: '#39A2DB',
    borderRadius: '3px'
  };

  return (
    <header style={{ 
      backgroundColor: 'var(--primary, #0F3460)',
      padding: '0.875rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Logo on left */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
            letterSpacing: '0.5px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer'
          }}>
            <span style={{ color: 'var(--primary-light, #39A2DB)' }}>Chassis</span> ReConnect
          </h1>
        </Link>
      </div>
      
      {/* Fixed Sections in middle */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem',
        padding: '0.25rem'
      }}>
        {/* Connect Link */}
        <Link href="/" passHref style={navLinkStyle(pathname === '/')} 
            onMouseOver={(e) => { if (pathname !== '/') e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseOut={(e) => { if (pathname !== '/') e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
            <Network size={18} /> Connect
            {pathname === '/' && <div style={activeUnderlineStyle} />}
        </Link>
        
        {/* Bookings Button (Update to Link when route exists) */}
        <button style={navLinkStyle(false)} // Assuming not active for now
            onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
          <CalendarDays size={18} /> Booking
        </button>
        
        {/* Activities Button (Example placeholder) */}
        <button style={navLinkStyle(false)} 
            onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
          <Activity size={18} /> Activity
        </button>
        
         {/* Testautomation Button (Example placeholder) */}
         <button style={navLinkStyle(false)} 
            onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
         >
          <FlaskConical size={18} /> Testautomation
         </button>
         
        {/* Database Link */}
        <Link href="/database" passHref style={navLinkStyle(pathname === '/database')}
            onMouseOver={(e) => { if (pathname !== '/database') e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseOut={(e) => { if (pathname !== '/database') e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
            <Database size={18} /> Database
            {pathname === '/database' && <div style={activeUnderlineStyle} />}
        </Link>
        
        {/* Admin Panel Link */}
        <Link href="/admin/users" passHref style={navLinkStyle(pathname?.startsWith('/admin') ?? false)}
            onMouseOver={(e) => { if (!pathname?.startsWith('/admin')) e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseOut={(e) => { if (!pathname?.startsWith('/admin')) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
            <Shield size={18} /> Admin Dashboard
            {pathname?.startsWith('/admin') && <div style={activeUnderlineStyle} />}
        </Link>
      </div>
      
      {/* Controls on right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Add Logo Image */}
        <Image 
          src="/logo.png" 
          alt="Company Logo"
          width={80}
          height={80}
        />

        <div className="search-container" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)' }}>
            <Search className="h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              color: 'white',
              padding: '0.5rem 1rem 0.5rem 2.25rem',
              width: '240px',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          />
        </div>
        
        {status === 'authenticated' && (
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: userMenuOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              aria-label="User menu"
            >
              <User size={20} color="white" />
            </button>
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.625rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '0.5rem 0',
                zIndex: 110,
                minWidth: '200px',
                animation: 'modalFadeIn 0.2s ease-out',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '12px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'white',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderBottom: 'none',
                  borderRight: 'none',
                  zIndex: 109
                }} />
                
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Signed in as</p>
                  <p style={{ margin: '0.1rem 0 0', fontWeight: 500, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.user?.email ?? 'User'}
                  </p>
                </div>

                <nav>
                  <button
                     style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.75rem',
                       textAlign: 'left',
                       padding: '0.875rem 1.25rem',
                       border: 'none',
                       backgroundColor: 'transparent',
                       cursor: 'pointer',
                       fontSize: '0.9rem',
                       color: '#333',
                       transition: 'background-color 0.2s',
                       borderRadius: '4px',
                       margin: '0.25rem 0.25rem',
                       width: 'calc(100% - 0.5rem)'
                     }}
                     onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f7f7f7'; }}
                     onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <UserCircle size={17} style={{ color: '#0F3460' }} />
                    My Account
                  </button>
                  <button
                     style={{ 
                       display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left',
                       padding: '0.875rem 1.25rem', border: 'none', backgroundColor: 'transparent',
                       cursor: 'pointer', fontSize: '0.9rem', color: '#333',
                       transition: 'background-color 0.2s', borderRadius: '4px',
                       margin: '0.25rem 0.25rem', width: 'calc(100% - 0.5rem)'
                     }}
                     onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f7f7f7'; }}
                     onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Settings size={17} style={{ color: '#0F3460' }} />
                    Settings
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0.5rem 0.25rem' }}></div>
                  <button
                     onClick={() => signOut()}
                     style={{
                       display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left',
                       padding: '0.875rem 1.25rem', border: 'none', backgroundColor: 'transparent',
                       cursor: 'pointer', fontSize: '0.9rem',
                       color: '#ef4444',
                       transition: 'background-color 0.2s',
                       borderRadius: '4px', margin: '0.25rem 0.25rem',
                       width: 'calc(100% - 0.5rem)'
                     }}
                     onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                     onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 