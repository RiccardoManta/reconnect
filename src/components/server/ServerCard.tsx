import React, { useState, useRef, useEffect } from 'react';
import { Link, User, Info, Settings, Wrench, PowerOff, Edit3, Users, Trash2 } from 'lucide-react';
import { ServerData } from './AddServerModal';

export interface ServerCardProps {
  id: string;
  dbId?: number;
  name: string;
  platform: string;
  bench_type: string;
  description: string;
  status: 'online' | 'offline' | 'in_use';
  user?: string;
  onOpenDeleteDialog: (dbId: number, serverName: string) => void;
  onOpenEditModal: (server: ServerData) => void;
}

export default function ServerCard({
  id,
  dbId,
  name,
  platform,
  bench_type,
  description,
  status,
  user,
  onOpenDeleteDialog,
  onOpenEditModal,
}: ServerCardProps) {

  const getStatusDetails = () => {
    switch (status) {
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
      default:
          return {
              dotColor: '#9ca3af', 
              text: 'Unknown', 
              backgroundColor: 'rgba(156, 163, 175, 0.1)'
          };
    }
  };

  const statusDetails = getStatusDetails();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMaintenance = () => { console.log(`Maintenance clicked for ${name}`); setIsMenuOpen(false); };
  const handleDeactivate = () => { console.log(`Deactivate clicked for ${name}`); setIsMenuOpen(false); };
  const handleEdit = () => {
    if (dbId !== undefined) {
      const serverData: ServerData = {
        dbId,
        name,
        platform,
        bench_type,
        description,
        status: status,
        user: user || ''
      };
      onOpenEditModal(serverData);
    } else {
      console.warn('Cannot edit card without dbId');
    }
    setIsMenuOpen(false);
  };
  const handleManageUser = () => { console.log(`Manage User clicked for ${name}`); setIsMenuOpen(false); };
  const handleDelete = () => {
    if (dbId !== undefined) {
      onOpenDeleteDialog(dbId, name);
    } else {
      console.warn('Cannot delete card without dbId');
    }
    setIsMenuOpen(false);
  };

  const renderMenuItem = (icon: React.ReactNode, text: string, action: () => void) => (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textAlign: 'left',
        padding: '0.75rem 1rem',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '0.875rem',
        width: '100%',
        color: '#374151',
        transition: 'background-color 0.2s'
      }}
      onClick={action}
      onMouseOver={(e) => { const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = '#f3f4f6'}}
      onMouseOut={(e) => { const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = 'transparent'}}
    >
      {icon}
      {text}
    </button>
  );

  return (
    <div className="server-card" id={id} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div className="card-header" style={{ flex: '1 1 auto' }}>
        <h3 className="card-title">{name}</h3>

        <div className="user-info">
          <div className="user-avatar" style={{ width: '1.5rem', height: '1.5rem', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#cbd5e1', borderRadius:'50%', marginRight:'0.5rem' }}>
            <User className="h-4 w-4" style={{ color: 'white' }} />
          </div>
          {user && user.trim() !== '' ? (
            <span className="user-name">{user}</span>
          ) : (
            <span className="user-name" style={{ fontStyle: 'italic', color: '#94a3b8' }}>No User</span>
          )}
        </div>

        {bench_type && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="category">
              {bench_type}
            </div>
          </div>
        )}

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
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
            onMouseOver={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = '#f2f2f2'}}
            onMouseOut={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = 'transparent'}}
            title="View Details"
          >
            <Info className="h-4 w-4" style={{ color: '#0F3460' }} />
          </button>

          <button
              className={`connect-button ${status}`}
              style={{
                  ...(status === 'in_use' && { backgroundColor: '#ef4444' /* Tailwind red-500 */ }),
              }}
              title={status === 'offline' ? "Server Offline" : "Connect"}
            >
            <Link className="h-4 w-4" style={{ color: status === 'online' || status === 'in_use' ? 'white' : '#4b5563' }} />
            <span style={{ color: status === 'online' || status === 'in_use' ? 'white' : 'inherit' }}>
              Connect
            </span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              ref={buttonRef}
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onMouseOver={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = '#f2f2f2'}}
              onMouseOut={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = 'transparent'}}
              title="Settings"
            >
              <Settings className="h-4 w-4" style={{ color: '#0F3460' }} />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  padding: '0.5rem 0',
                  zIndex: 50,
                  minWidth: '180px',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '12px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'white',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderTop: 'none',
                  borderLeft: 'none',
                  zIndex: 49
                }} />

                {renderMenuItem(<Wrench size={16} />, 'Maintenance', handleMaintenance)}
                {renderMenuItem(<PowerOff size={16} />, 'Deactivate', handleDeactivate)}
                {renderMenuItem(<Edit3 size={16} />, 'Edit', handleEdit)}
                {renderMenuItem(<Users size={16} />, 'Manage User', handleManageUser)}
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.5rem 0' }} />
                {renderMenuItem(<Trash2 size={16} color="#ef4444"/>, 'Delete', handleDelete)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}