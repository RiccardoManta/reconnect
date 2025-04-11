import React from 'react';
import { Link, User, Info, Settings } from 'lucide-react';

interface ServerCardProps {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  status: 'online' | 'offline' | 'in_use';
  user?: string;
  id: string;
}

export default function ServerCard({
  id,
  name,
  category,
  subcategory,
  description,
  status,
  user,
}: ServerCardProps) {
  // Determine status based on user presence
  const effectiveStatus = user && user.trim() !== '' ? 'in_use' : 'online';
  
  // If explicitly set to offline, keep it offline regardless of user
  const finalStatus = status === 'offline' ? 'offline' : effectiveStatus;
  
  // Get status color and text based on server status
  const getStatusDetails = () => {
    switch (finalStatus) {
      case 'online':
        return {
          dotColor: '#10b981',
          text: 'Online',
          backgroundColor: 'rgba(16, 185, 129, 0.1)' // Transparent green
        };
      case 'offline':
        return {
          dotColor: '#9ca3af',
          text: 'Offline',
          backgroundColor: 'rgba(156, 163, 175, 0.1)' // Transparent grey
        };
      case 'in_use':
        return {
          dotColor: '#ef4444',
          text: 'In Use',
          backgroundColor: 'rgba(239, 68, 68, 0.1)' // Transparent red
        };
    }
  };

  const statusDetails = getStatusDetails();
  
  return (
    <div className="server-card" id={id} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div className="card-header" style={{ flex: '1 1 auto' }}>
        <h3 className="card-title">{name}</h3>
        
        <div className="user-info">
          <div className="user-avatar" style={{ width: '1.5rem', height: '1.5rem' }}>
            <User className="h-4 w-4" style={{ color: 'white' }} />
          </div>
          {user && user.trim() !== '' ? (
            <span className="user-name">{user}</span>
          ) : (
            <span className="user-name" style={{ fontStyle: 'italic', color: '#94a3b8' }}>No User</span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div className="category">{category}</div>
          {subcategory && (
            <div className="category">
              {subcategory}
            </div>
          )}
        </div>
        
        <p className="description">{description}</p>
      </div>
      
      <div className="card-footer" style={{ 
        backgroundColor: statusDetails.backgroundColor,
        transition: 'background-color 0.3s ease',
        marginTop: 'auto'
      }}>
        <div className="status">
          <div className="status-dot" style={{ 
            backgroundColor: statusDetails.dotColor,
            boxShadow: `0 0 5px ${statusDetails.dotColor}`
          }}></div>
          <span className="status-text">{statusDetails.text}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="View Details"
          >
            <Info className="h-4 w-4" style={{ color: '#0F3460' }} />
          </button>
          
          <button className={`connect-button ${finalStatus === 'online' ? 'online' : finalStatus === 'in_use' ? 'in-use' : 'offline'}`}>
            <Link className="h-4 w-4" style={{ color: finalStatus === 'online' || finalStatus === 'in_use' ? 'white' : '#4b5563' }} />
            Connect
          </button>
          
          <button
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Settings"
          >
            <Settings className="h-4 w-4" style={{ color: '#0F3460' }} />
          </button>
        </div>
      </div>
    </div>
  );
} 