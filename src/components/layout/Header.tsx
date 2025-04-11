import React, { useState } from 'react';
import { Search, User, Settings } from 'lucide-react';

const categories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

export default function Header() {
  const [activeCategory, setActiveCategory] = useState<string>("Servers");

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
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo on left */}
      <h1 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: 'white',
        margin: 0
      }}>Chassis ReConnect</h1>
      
      {/* Categories in middle */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            style={{
              background: 'none',
              border: 'none',
              color: activeCategory === category ? 'white' : 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              fontWeight: activeCategory === category ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
          <Settings className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
        </button>
        
        <div className="search-container">
          <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)' }}>
            <Search className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
          />
        </div>
        
        <div className="user-avatar">
          <User className="h-5 w-5" style={{ color: 'white' }} />
        </div>
      </div>
    </header>
  );
} 