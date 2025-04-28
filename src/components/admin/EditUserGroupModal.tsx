'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { keysToCamel } from '@/utils/caseConverter'; // Import keysToCamel

// Export the expected structure for user data passed as props
export interface ModalUserData {
  userId: number;
  userName: string;
  email: string;
  groupId: number | null; // Expect current group ID (as passed from AdminUsersPage)
}

// Interface for Group data fetched from API (after keysToCamel)
interface Group {
  userGroupId: number; // Updated from groupId
  userGroupName: string; // Updated from groupName
}

interface EditUserGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: ModalUserData; // Use exported type
  // onSave signature still uses groupId as that's what the modal manages internally
  onSave: (data: { userId: number; groupId: number | null }) => Promise<void>; 
}

const EditUserGroupModal: React.FC<EditUserGroupModalProps> = ({
  isOpen,
  onClose,
  userData,
  onSave,
}) => {
  // State for the selected group ID (still corresponds to the value in the select dropdown)
  const [selectedGroupId, setSelectedGroupId] = useState<string>(''); // Store as string for select value
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available groups when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingGroups(true);
      fetch('/api/admin/groups')
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch groups');
            }
            return res.json();
        })
        .then(data => {
            // API returns user_group_id, user_group_name -> keysToCamel -> userGroupId, userGroupName
            // This now matches the updated internal Group interface
            setAvailableGroups(keysToCamel<Group[]>(data.groups || []));
        })
        .catch(err => {
            console.error("Error fetching groups:", err);
            setError('Could not load groups.');
        })
        .finally(() => {
            setLoadingGroups(false);
        });
    }
  }, [isOpen]);

  // Update local state when userData changes
  useEffect(() => {
    if (userData) {
      // Initialize with current groupId, converting null/number to string for select
      setSelectedGroupId(userData.groupId !== null ? String(userData.groupId) : ''); 
    }
  }, [userData]);

  if (!isOpen || !userData) return null;

  const handleSaveClick = async () => {
    setSaving(true);
    setError(null);
    try {
      // Pass back userId and the selected groupId (converted back to number/null)
      // This matches the onSave prop expectation
      await onSave({ 
          userId: userData.userId, 
          groupId: selectedGroupId === '' ? null : parseInt(selectedGroupId, 10) 
      });
      // Parent component should handle closing on success
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
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
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            Edit User Group
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

        {/* User Info (Read-only) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>User Name</p>
          <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937', fontWeight: 500 }}>{userData.userName}</p>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>Email</p>
          <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{userData.email}</p>
        </div>

        {/* Group Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="userGroup" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Assign Group
          </label>
          {loadingGroups ? (
            <div style={{color: '#6b7280'}}>Loading groups...</div>
          ) : (
            <select
              id="userGroup"
              value={selectedGroupId} // This string value should match the option value
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={loadingGroups}
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #d1d5db', fontSize: '0.875rem', backgroundColor: 'white',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <option value="">-- No Group --</option> 
              {availableGroups.map((group) => (
                // Use the updated field names: userGroupId and userGroupName
                <option key={group.userGroupId} value={String(group.userGroupId)}>
                  {group.userGroupName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Modal Footer (Actions) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          paddingTop: '1rem', borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem',
              backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving || loadingGroups}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem',
              backgroundColor: saving ? '#93c5fd' : '#2563eb',
              color: 'white', border: 'none',
              cursor: (saving || loadingGroups) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontWeight: 500
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default EditUserGroupModal; 