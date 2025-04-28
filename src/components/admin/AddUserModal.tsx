'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, RefreshCw } from 'lucide-react';
import { keysToCamel } from '@/utils/caseConverter';

// Interface for Group data fetched from API (matches Edit modal)
interface Group {
  userGroupId: number;
  userGroupName: string;
}

// Interface for the data passed back on save
export interface NewUserData {
  userName: string;
  companyUsername?: string | null;
  email: string;
  password?: string; // Password is required for new user
  userGroupId: number | null;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewUserData) => Promise<void>;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  // Form state
  const [userName, setUserName] = useState('');
  const [companyUsername, setCompanyUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(''); // Store as string for select value

  // Group fetching state
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // General modal state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUserName('');
      setCompanyUsername('');
      setEmail('');
      setPassword('');
      setSelectedGroupId('');
      setError(null);
      setSaving(false);

      // Fetch groups
      setLoadingGroups(true);
      fetch('/api/admin/groups')
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch groups');
          }
          return res.json();
        })
        .then(data => {
          setAvailableGroups(keysToCamel<Group[]>(data.groups || []));
        })
        .catch(err => {
          console.error("Error fetching groups:", err);
          setError('Could not load groups. Please close and reopen the modal.');
        })
        .finally(() => {
          setLoadingGroups(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClick = async () => {
    if (!userName || !email || !password) {
        setError('User Name, Email, and Password are required.');
        return;
    }
    
    setSaving(true);
    setError(null);
    try {
      await onSave({ 
          userName,
          companyUsername: companyUsername || null, // Send null if empty
          email,
          password,
          userGroupId: selectedGroupId === '' ? null : parseInt(selectedGroupId, 10)
      });
      // Parent component (AdminUsersPage) should handle closing the modal on success via its own logic
    } catch (err) {
      // Error handling might be done in the parent, but we can show a generic message here too
      setError(`Failed to save user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error in AddUserModal save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1050,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem 2rem',
        width: '90%',
        maxWidth: '550px', // Slightly wider for the form
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            Add New User
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c',
            borderRadius: '0.25rem', marginBottom: '1rem', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="userName" style={styles.label}>User Name <span style={{color: 'red'}}>*</span></label>
            <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} style={styles.input} required />
          </div>
          <div>
            <label htmlFor="companyUsername" style={styles.label}>Company Username</label>
            <input type="text" id="companyUsername" value={companyUsername} onChange={(e) => setCompanyUsername(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label htmlFor="email" style={styles.label}>Email <span style={{color: 'red'}}>*</span></label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          </div>
          <div>
            <label htmlFor="password" style={styles.label}>Password <span style={{color: 'red'}}>*</span></label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Choose a strong password.</p>
          </div>
          <div>
             <label htmlFor="userGroupAdd" style={styles.label}>Assign Group</label>
             {loadingGroups ? (
                <div style={{color: '#6b7280'}}>Loading groups...</div>
             ) : (
                <select
                  id="userGroupAdd"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  disabled={loadingGroups}
                  style={styles.input} // Reuse input style for select
                >
                  <option value="">-- No Group --</option> 
                  {availableGroups.map((group) => (
                    <option key={group.userGroupId} value={String(group.userGroupId)}>
                      {group.userGroupName}
                    </option>
                  ))}
                </select>
             )}
          </div>
        </div>

        {/* Modal Footer (Actions) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={styles.buttonSecondary}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving || loadingGroups}
            style={saving || loadingGroups ? {...styles.buttonPrimary, ...styles.buttonDisabled} : styles.buttonPrimary}
          >
            {saving ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Add User
              </>
            )}
          </button>
        </div>
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// Basic styles object
const styles = {
  label: {
    display: 'block', 
    fontSize: '0.875rem', 
    fontWeight: '500', 
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
  buttonPrimary: {
    padding: '0.5rem 1rem', 
    borderRadius: '0.375rem', 
    fontSize: '0.875rem',
    backgroundColor: '#10b981', // Green for add
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

export default AddUserModal; 