import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Settings, Menu, Database, BookOpen, Shield } from 'lucide-react';
import Link from 'next/link';

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

export default function Header() {
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
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
            <Menu className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.95)' }} />
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
        
        <div className="user-avatar" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #39A2DB, #3db6eb)',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        }}>
          <User className="h-5 w-5" style={{ color: 'white' }} />
        </div>
      </div>
    </header>
  );
} 