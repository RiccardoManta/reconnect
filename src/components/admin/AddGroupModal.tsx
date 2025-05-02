'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, RefreshCw } from 'lucide-react';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave expects the new group name string
  onSave: (groupName: string) => Promise<void>; 
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setError(null);
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClick = async () => {
    if (!groupName.trim()) {
        setError('Group Name cannot be empty.');
        return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await onSave(groupName.trim());
      // Parent component should handle closing on success
    } catch (err) {
      setError(`Failed to save group: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error in AddGroupModal save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContainer}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add New Group</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Form Field */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="groupName" style={styles.label}>Group Name <span style={{color: 'red'}}>*</span></label>
          <input 
            type="text" 
            id="groupName" 
            value={groupName} 
            onChange={(e) => setGroupName(e.target.value)} 
            style={styles.input} 
            required 
            disabled={saving}
          />
        </div>

        {/* Modal Footer (Actions) */}
        <div style={styles.modalFooter}>
          <button
            onClick={onClose}
            style={styles.buttonSecondary}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving}
            style={saving ? {...styles.buttonPrimary, ...styles.buttonDisabled} : styles.buttonPrimary}
          >
            {saving ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Add Group
              </>
            )}
          </button>
        </div>
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// Reusing and adapting styles
const styles = {
  overlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1050,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem 2rem',
    width: '90%',
    maxWidth: '450px', // Slightly smaller modal
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' 
  },
  errorBox: {
    padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c',
    borderRadius: '0.25rem', marginBottom: '1rem', fontSize: '0.875rem'
  },
  label: {
    display: 'block', 
    fontSize: '0.875rem', 
    fontWeight: 500, 
    color: '#374151', 
    marginBottom: '0.5rem' 
  },
  input: {
    width: '100%', 
    padding: '0.6rem 0.75rem', 
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db', 
    fontSize: '0.875rem', 
    backgroundColor: 'white',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
  },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
    paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #e5e7eb'
  },
  buttonPrimary: {
    padding: '0.5rem 1rem', 
    borderRadius: '0.375rem', 
    fontSize: '0.875rem',
    backgroundColor: '#39A2DB', // Changed color
    color: 'white', 
    border: 'none',
    cursor: 'pointer',
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem',
    fontWeight: 500
  },
  buttonSecondary: {
    padding: '0.5rem 1rem', 
    borderRadius: '0.375rem', 
    fontSize: '0.875rem',
    backgroundColor: '#f3f4f6', 
    color: '#374151', 
    border: '1px solid #d1d5db',
    cursor: 'pointer', 
    fontWeight: 500
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af', 
    cursor: 'not-allowed'
  }
};

export default AddGroupModal; 