import React from 'react';
import { X } from 'lucide-react';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any>;
  excludeFields?: string[];
}

const DetailsModal: React.FC<DetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  data,
  excludeFields = []
}) => {
  if (!isOpen) return null;

  // Filter out fields that should be excluded
  const entries = Object.entries(data).filter(([key]) => !excludeFields.includes(key));

  // Helper function to format field names
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')  // Replace underscores with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
          }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            <X size={24} />
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {entries.map(([key, value]) => (
            <div key={key} style={{
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#4b5563',
                marginBottom: '0.25rem',
              }}>
                {formatFieldName(key)}
              </div>
              <div style={{
                fontSize: '1rem',
                color: '#111827',
                overflowWrap: 'break-word',
              }}>
                {value !== null && value !== undefined ? String(value) : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal; 