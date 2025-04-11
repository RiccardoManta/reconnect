import React from 'react';
import { Link, User, Info, Settings } from 'lucide-react';

interface ServerCardProps {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  isOnline: boolean;
  user?: string;
  id: string;
}

export default function ServerCard({
  id,
  name,
  category,
  subcategory,
  description,
  isOnline,
  user,
}: ServerCardProps) {
  return (
    <div className="server-card" id={id}>
      <div className="card-header">
        <h3 className="card-title">{name}</h3>
        
        <div className="user-info">
          <div className="user-avatar" style={{ width: '1.5rem', height: '1.5rem' }}>
            <User className="h-4 w-4" style={{ color: 'white' }} />
          </div>
          <span className="user-name">{user || "No User"}</span>
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
      
      <div className="card-footer">
        <div className="status">
          <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
          <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
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
          
          <button className={`connect-button ${isOnline ? 'online' : 'offline'}`}>
            <Link className="h-4 w-4" style={{ color: isOnline ? 'white' : '#4b5563' }} />
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