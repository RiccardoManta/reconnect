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
  
  // Normalize status for internal consistency (e.g., handle 'in use')
  const normalizedStatus = status === 'in_use' ? 'in_use' : status;

  // Determine status details based on the normalized status
  const getStatusDetails = () => {
    switch (normalizedStatus) {
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
          // Provide a fallback or default status
          return {
              dotColor: '#9ca3af', 
              text: 'Unknown', 
              backgroundColor: 'rgba(156, 163, 175, 0.1)'
          };
    }
  };

  const statusDetails = getStatusDetails();
  
  // --- Menu State --- 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the button itself

  // Close menu when clicking outside
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

  // --- Menu Action Handlers --- 
  const handleMaintenance = () => { console.log(`Maintenance clicked for ${name}`); setIsMenuOpen(false); };
  const handleDeactivate = () => { console.log(`Deactivate clicked for ${name}`); setIsMenuOpen(false); };
  const handleManageUser = () => { console.log(`Manage User clicked for ${name}`); setIsMenuOpen(false); };
  
  const handleEdit = () => {
    if (dbId !== undefined) { 
      // Construct the ServerData object expected by the modal
      const serverData: ServerData = {
        dbId,
        name,
        platform,
        bench_type,
        description,
        status: normalizedStatus,
        user: user || ''
      };
      onOpenEditModal(serverData);
    } else {
      console.warn('Cannot edit card without dbId');
    }
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    if (dbId !== undefined) {
      onOpenDeleteDialog(dbId, name); // Call parent to open dialog
    } else {
      console.warn('Cannot delete card without dbId');
    }
    setIsMenuOpen(false); // Close the settings menu regardless
  };
  
  // --- Helper to render menu items --- 
  const renderMenuItem = (icon: React.ReactNode, text: string, action: () => void) => (
    <button 
      className="flex items-center gap-3 text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 w-full transition-colors duration-150 ease-in-out"
      onClick={action}
    >
      {icon}
      {text}
    </button>
  );

  return (
    <div 
      className="server-card flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-shadow hover:shadow-lg"
      id={id} 
    >
      {/* Card Header */}      
      <div className="p-4 flex-grow">
        <h3 className="card-title text-lg font-semibold text-gray-800 mb-2 truncate">{name}</h3>
        
        {/* User Info */}        
        <div className="user-info flex items-center gap-2 mb-2 text-sm text-gray-600">
          <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
          {user && user.trim() !== '' ? (
            <span className="user-name truncate">{user}</span>
          ) : (
            <span className="user-name italic text-gray-400">No User</span>
          )}
        </div>
        
        {/* Bench Type / Subcategory */}        
        {bench_type && (
          <div className="mb-3">
            <span className="category inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {bench_type}
            </span>
          </div>
        )}
        
        {/* Description */}        
        <p className="description text-sm text-gray-600 line-clamp-3 mb-4">
            {description}
        </p>
      </div>
      
      {/* Card Footer */}      
      <div 
        className="card-footer px-4 py-3 border-t border-gray-100 transition-colors duration-300 ease-in-out flex items-center justify-between"
        style={{ backgroundColor: statusDetails.backgroundColor }}
      >
        {/* Status Indicator */}        
        <div className="status flex items-center gap-2">
          <div 
            className="status-dot w-2.5 h-2.5 rounded-full"
            style={{ 
              backgroundColor: statusDetails.dotColor,
              boxShadow: `0 0 6px ${statusDetails.dotColor}`
            }}
          ></div>
          <span className="status-text text-sm font-medium" style={{ color: statusDetails.dotColor }}>
            {statusDetails.text}
          </span>
        </div>
        
        {/* Action Buttons */}        
        <div className="flex items-center gap-2 relative">
          {/* Connect Button - Simplified style */}          
          <button 
            className={`connect-button flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${normalizedStatus === 'offline' 
                ? 'bg-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            disabled={normalizedStatus === 'offline'}
            title={normalizedStatus === 'offline' ? "Server Offline" : "Connect"}
          >
            <Link className="h-4 w-4" />
            Connect
          </button>
          
          {/* Settings Button & Menu */}          
          <div className="relative">
            <button
              ref={buttonRef}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Settings Menu Dropdown */}            
            {isMenuOpen && (
              <div 
                ref={menuRef}
                className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50 origin-bottom-right animate-scale-in"
              >
                {/* Triangle Pointer */}                
                <div className="absolute bottom-[-5px] right-3 w-3 h-3 bg-white transform rotate-45 ring-1 ring-black ring-opacity-5" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}/>
                
                {/* Menu Items */}                
                {renderMenuItem(<Wrench size={16} />, 'Maintenance', handleMaintenance)}
                {renderMenuItem(<PowerOff size={16} />, 'Deactivate', handleDeactivate)}
                {renderMenuItem(<Edit3 size={16} />, 'Edit', handleEdit)}
                {renderMenuItem(<Users size={16} />, 'Manage User', handleManageUser)}
                <div className="h-px bg-gray-200 mx-1 my-1" /> {/* Separator */}
                {renderMenuItem(<Trash2 size={16} className="text-red-600"/>, 'Delete', handleDelete)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Optional: Add animation classes for entry if needed */}
      <style jsx>{`
        .animate-scale-in {
          animation: scaleIn 0.1s ease-out forwards;
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}</style>
    </div>
  );
} 