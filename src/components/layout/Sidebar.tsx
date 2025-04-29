import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Server, Circle } from 'lucide-react';

// Define the structure for server data based on API response and ServerCardProps
// (Duplicated from page.tsx - consider moving to a shared types file later)
interface DisplayServerData {
  pcId: number;          
  casualName: string | null;
  platformName?: string | null; 
  benchType: string | null;   
  pcInfoText?: string | null;  
  status: string | null;      
  activeUser?: string | null; 
  platformId?: number | null; 
}

// Update SidebarProps to use the new type
interface SidebarProps {
  servers: DisplayServerData[];
  categories: string[];
  onCategoryClick: (category: string) => void;
  onServerClick: (serverElementId: string) => void;
}

export default function Sidebar({
  servers,
  categories,
  onCategoryClick,
  onServerClick,
}: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // EFFECT to update expanded state when categories prop changes
  useEffect(() => {
    const allExpandedState = categories.reduce((acc, category) => {
      acc[category] = true; // Always default to expanded
      return acc;
    }, {} as Record<string, boolean>);
    
    setExpandedCategories(allExpandedState);
    
  }, [categories]);

  // Toggle category expansion
  const toggleCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onCategoryClick
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group servers by category - Use platformName and DisplayServerData
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter((server) => server.platformName === category);
    return acc;
  }, {} as Record<string, DisplayServerData[]>); // Use DisplayServerData

  // Get effective status based on user presence and explicitly set status
  const getEffectiveStatus = (server: DisplayServerData) => {
    if (server.status?.toLowerCase() === 'offline') return 'offline';
    // Use activeUser
    return server.activeUser && server.activeUser.trim() !== '' ? 'in_use' : 'online'; 
  };

  // Update the status indicator in the sidebar
  const getStatusColor = (server: DisplayServerData) => {
    const effectiveStatus = getEffectiveStatus(server);
    switch (effectiveStatus) {
      case 'online':
        return '#10b981'; // Green
      case 'offline':
        return '#9ca3af'; // Grey
      case 'in_use':
        return '#ef4444'; // Red
      default:
        return '#9ca3af'; // Default to Grey
    }
  };

  return (
    <div style={{
      width: '380px',
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
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.backgroundColor = '#e2e8f0';
              }}
              onMouseOut={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.backgroundColor = '#edf2f7';
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
              <span style={{ fontWeight: 'bold', flexGrow: 1, marginRight: '0.5rem' }}>{category}</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.8rem',
                color: '#64748b',
                flexShrink: 0
              }}>
                {serversByCategory[category]?.length || 0}
              </span>
            </div>

            {/* Servers list */}
            {expandedCategories[category] && (
              <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                {(serversByCategory[category]?.length || 0) > 0 ? (
                    serversByCategory[category].map((server) => (
                      // Use pcId as key and for click handler
                      <div
                        key={`${category}-${server.pcId}`}
                        onClick={() => onServerClick(`server-card-${server.pcId}`)}
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
                            const target = e.currentTarget as HTMLDivElement;
                            target.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseOut={(e) => {
                            const target = e.currentTarget as HTMLDivElement;
                            target.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Server size={14} style={{ marginRight: '0.5rem', color: '#64748b', flexShrink: 0 }} />
                        <span style={{ fontWeight: 'normal', color: '#333' }}>
                          {server.casualName} {/* Use casualName */}
                        </span>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <Circle
                              size={8}
                              fill={getStatusColor(server)}
                              color={getStatusColor(server)}
                              style={{ marginRight: '0.25rem' }}
                            />
                            {/* Use activeUser */} 
                            {server.activeUser && server.activeUser.trim() !== '' && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: '#9ca3af',
                                    fontStyle: 'italic',
                                    marginLeft: '0.5rem'
                                }}>
                                    {server.activeUser}
                                </span>
                            )}
                        </div>
                      </div>
                    ))
                ) : (
                    <div style={{ padding: '0.375rem 0.5rem', fontSize: '0.9rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        No servers in this category
                    </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 