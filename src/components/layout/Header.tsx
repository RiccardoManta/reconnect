'use client'; // Make this a client component

import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Settings, Menu, Database, BookOpen, Shield, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

export default function Header() {
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();

  // Fetch categories from the API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        
        // Try to get categories from the API response
        let categoriesList: string[] = [];
        
        if (data.categories && data.categories.length > 0) {
          categoriesList = data.categories;
        } else {
          // Fallback to getting all unique categories from test_benches table
          try {
            const benches = await fetch('/api/testbenches');
            if (benches.ok) {
              const benchData = await benches.json();
              if (benchData.testBenches && benchData.testBenches.length > 0) {
                // Get unique bench types with proper type handling
                const uniqueTypes: string[] = [];
                benchData.testBenches.forEach((bench: any) => {
                  const benchType = bench.bench_type;
                  if (benchType && typeof benchType === 'string' && !uniqueTypes.includes(benchType)) {
                    uniqueTypes.push(benchType);
                  }
                });
                
                if (uniqueTypes.length > 0) {
                  categoriesList = uniqueTypes;
                }
              }
            }
          } catch (benchError) {
            console.error('Error fetching bench types:', benchError);
          }
        }
        
        // If still no categories, use fallback
        if (categoriesList.length === 0) {
          console.warn('No categories found, using fallback');
          categoriesList = fallbackCategories;
        }
        
        setCategories(categoriesList);
        // Set first category as active by default if none is selected
        if (!activeCategory && categoriesList.length > 0) {
          setActiveCategory(categoriesList[0]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Use fallback categories if API fails
        setCategories(fallbackCategories);
        if (!activeCategory) {
          setActiveCategory(fallbackCategories[0]);
        }
      }
    }
    
    fetchCategories();
  }, [activeCategory]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll to category section when clicked
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    
    // Find the category section and scroll to it with improved smoothness
    const section = document.getElementById(`category-${category.toLowerCase()}`);
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  return (
    <header style={{ 
      backgroundColor: '#0F3460',
      backgroundImage: 'linear-gradient(to right, #0F3460, #1A4D7C)',
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
            <span style={{ color: '#39A2DB' }}>Chassis</span> ReConnect
          </h1>
        </Link>
      </div>
      
      {/* Categories in middle */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem',
        padding: '0.25rem'
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            style={{
              background: 'none',
              border: 'none',
              color: activeCategory === category ? 'white' : 'rgba(255,255,255,0.75)',
              fontSize: '0.875rem',
              fontWeight: activeCategory === category ? '600' : 'normal',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (activeCategory !== category) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }
            }}
            onMouseOut={(e) => {
              if (activeCategory !== category) {
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
              }
            }}
          >
            {category}
            {activeCategory === category && (
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
                height: '3px',
                width: '40%',
                backgroundColor: '#39A2DB',
                borderRadius: '3px'
              }} />
            )}
          </button>
        ))}
      </div>
      
      {/* Controls on right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Menu dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setMenuOpen(!menuOpen)}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Menu size={20} color="white" />
          </button>
          
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.625rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              padding: '0.5rem 0',
              zIndex: 10,
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
                zIndex: 9
              }} />
              
              <button style={{
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
                margin: '0 0.25rem',
                width: 'calc(100% - 0.5rem)'
              }} onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f7f7f7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <Shield size={17} style={{ color: '#0F3460' }} />
                Admin Panel
              </button>
              
              <Link href="/database" style={{ textDecoration: 'none' }}>
                <button style={{
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
                  margin: '0 0.25rem',
                  width: 'calc(100% - 0.5rem)'
                }} onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7f7f7';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <Database size={17} style={{ color: '#0F3460' }} />
                  Database
                </button>
              </Link>
              
              <button style={{
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
                margin: '0 0.25rem',
                width: 'calc(100% - 0.5rem)'
              }} onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f7f7f7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <BookOpen size={17} style={{ color: '#0F3460' }} />
                Bookings
              </button>
            </div>
          )}
        </div>

        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Settings className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.95)' }} />
        </button>
        
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