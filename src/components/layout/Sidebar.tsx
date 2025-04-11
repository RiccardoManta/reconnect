import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Server, Circle } from 'lucide-react';
import { ServerData } from '@/components/server/AddServerModal';

interface SidebarProps {
  servers: ServerData[];
  categories: string[];
  onCategoryClick: (category: string) => void;
}

export default function Sidebar({ servers, categories, onCategoryClick }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    // Initialize all categories as expanded
    categories.reduce((acc, category) => ({ ...acc, [category]: true }), {})
  );

  // Toggle category expansion
  const toggleCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onCategoryClick
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group servers by category
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter(server => server.category === category);
    return acc;
  }, {} as Record<string, ServerData[]>);

  return (
    <div style={{
      width: '280px',
      borderRight: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      height: 'calc(100vh - 73px)', // Subtract header height
      overflowY: 'auto',
      padding: '1rem'
    }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: '1rem',
        letterSpacing: '0.05em'
      }}>
        Server Explorer
      </h3>

      <div>
        {categories.map(category => (
          <div key={category} style={{ marginBottom: '0.5rem' }}>
            {/* Category header */}
            <div 
              onClick={() => onCategoryClick(category)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                backgroundColor: '#edf2f7',
                color: '#0F3460',
                fontWeight: 'semibold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e2e8f0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#edf2f7';
              }}
            >
              <span 
                onClick={(e) => toggleCategory(category, e)}
                style={{
                  display: 'inline-flex',
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                {expandedCategories[category] ? 
                  <ChevronDown size={18} /> :
                  <ChevronRight size={18} />
                }
              </span>
              <span style={{ fontWeight: 'bold' }}>{category}</span>
              <span style={{ 
                marginLeft: 'auto', 
                fontSize: '0.8rem',
                color: '#64748b' 
              }}>
                {serversByCategory[category].length}
              </span>
            </div>

            {/* Servers list */}
            {expandedCategories[category] && (
              <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                {serversByCategory[category].map((server, idx) => (
                  <div 
                    key={`${category}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.375rem 0.5rem',
                      marginBottom: '0.25rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Server size={14} style={{ marginRight: '0.5rem', color: '#64748b' }} />
                    <span>{server.name}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                      <Circle 
                        size={8} 
                        fill={server.isOnline ? "#10b981" : "#ef4444"} 
                        color={server.isOnline ? "#10b981" : "#ef4444"}
                        style={{ marginRight: '0.25rem' }}
                      />
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: server.user ? '#64748b' : '#94a3b8',
                        fontStyle: server.user ? 'normal' : 'italic'
                      }}>
                        {server.user || 'No user'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 