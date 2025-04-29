import React, { useState, useRef, useEffect } from 'react';
import { Link, User, Info, Settings, Wrench, PowerOff, Edit3, Users, Trash2 } from 'lucide-react';
import { ServerData } from './AddServerModal';

export interface ServerCardProps {
  pcId: number;
  casualName: string | null;
  platformName?: string | null;
  benchType: string | null;
  pcInfoText?: string | null;
  status: string | null;
  activeUser?: string | null;
  platformId?: number | null;
  onOpenDeleteDialog: (pcId: number, serverName: string) => void;
  onOpenEditModal: (server: any) => void;
}

export default function ServerCard({
  pcId,
  casualName,
  platformName,
  benchType,
  pcInfoText,
  status,
  activeUser,
  onOpenDeleteDialog,
  onOpenEditModal,
}: ServerCardProps) {

  const getStatusDetails = () => {
    const dbStatus = typeof status === 'string' ? status.toLowerCase() : 'unknown';
    const hasUser = activeUser && activeUser.trim() !== '';

    // 1. Handle explicit 'offline' from DB (highest priority)
    if (dbStatus === 'offline') {
      return {
        text: 'Offline', 
        dotColor: '#9ca3af', // Grey
        backgroundColor: 'rgba(156, 163, 175, 0.1)' 
      };
    }

    // 2. Handle 'In Use' state (if not offline AND user exists)
    if (hasUser) {
      return {
        text: 'In Use', 
        dotColor: '#ef4444', // Red
        backgroundColor: 'rgba(239, 68, 68, 0.1)' 
      };
    }

    // 3. Handle explicit 'Online' from DB (if not offline and no user)
    if (dbStatus === 'online') {
      return {
        text: 'Online', 
        dotColor: '#10b981', // Green
        backgroundColor: 'rgba(16, 185, 129, 0.1)' 
      };
    }
    
    // 4. Default: Display other non-offline statuses from DB when no user is present
    //    (e.g., 'maintenance', 'error', or even if dbStatus is 'unknown')
    return {
        text: status || 'Unknown', // Display original status text (maintains case)
        dotColor: '#f59e0b', // Amber color for other states
        backgroundColor: 'rgba(245, 158, 11, 0.1)' 
    };
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

  const handleMaintenance = () => { console.log(`Maintenance clicked for ${casualName}`); setIsMenuOpen(false); };
  const handleDeactivate = () => { console.log(`Deactivate clicked for ${casualName}`); setIsMenuOpen(false); };
  const handleEdit = () => {
    const serverDataForModal = {
      dbId: pcId,
      casual_name: casualName || '',
      platform: platformName || '',
      bench_type: benchType || '',
      pc_info_text: pcInfoText || '',
      status: status as any,
      user_name: activeUser || ''
    };
    onOpenEditModal(serverDataForModal);
    setIsMenuOpen(false);
  };
  const handleManageUser = () => { console.log(`Manage User clicked for ${casualName}`); setIsMenuOpen(false); };
  const handleDelete = () => {
    onOpenDeleteDialog(pcId, casualName || 'Unknown Server');
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
    <div className="server-card" id={`server-${pcId}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div className="card-header" style={{ flex: '1 1 auto' }}>
        <h3 className="card-title">{casualName}</h3>

        <div className="user-info">
          <div className="user-avatar" style={{ width: '1.5rem', height: '1.5rem', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#cbd5e1', borderRadius:'50%', marginRight:'0.5rem' }}>
            <User className="h-4 w-4" style={{ color: 'white' }} />
          </div>
          {activeUser && activeUser.trim() !== '' ? (
            <span className="user-name">{activeUser}</span>
          ) : (
            <span className="user-name" style={{ fontStyle: 'italic', color: '#94a3b8' }}>No User</span>
          )}
        </div>

        {benchType && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="category">
              {benchType}
            </div>
          </div>
        )}

        <p className="description">{pcInfoText}</p>
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
              className={`connect-button ${status ? status.toLowerCase() : 'unknown'}`}
              style={{
                  ...(statusDetails.text === 'In Use' && { backgroundColor: '#ef4444' /* Tailwind red-500 */ }),
              }}
              title={statusDetails.text === 'Offline' ? "Server Offline" : "Connect"}
            >
            <Link className="h-4 w-4" style={{ color: statusDetails.text !== 'Offline' ? 'white' : '#4b5563' }} />
            <span style={{ color: statusDetails.text !== 'Offline' ? 'white' : 'inherit' }}>
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

                {renderMenuItem(<Wrench size={16} />, 'Maintenance Mode', handleMaintenance)}
                {renderMenuItem(<PowerOff size={16} />, 'Deactivate', handleDeactivate)}
                {renderMenuItem(<Edit3 size={16} />, 'Edit Server', handleEdit)}
                {renderMenuItem(<Users size={16} />, 'Manage User', handleManageUser)}
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '0.25rem 0' }}></div>
                {renderMenuItem(<Trash2 size={16} style={{color: '#dc2626'}} />, 'Delete Server', handleDelete)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}