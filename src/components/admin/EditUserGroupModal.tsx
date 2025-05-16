'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';

// Export the expected structure for user data passed as props
export interface ModalUserData {
  user_id: number;
  user_name: string;
  email: string;
  user_group_id: number | null; 
}

// Interface for Group data fetched from API (already snake_case)
interface Group {
  user_group_id: number; 
  user_group_name: string; 
  permission_id?: number;
  permission_name?: string;
  accessible_platform_ids?: string | null;
  accessible_platform_names?: string | null;
}

interface EditUserGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ModalUserData; // Changed back from user_data to user
  onSave: (data: { user_id: number; user_group_id: number | null }) => Promise<void>; 
}

const EditUserGroupModal: React.FC<EditUserGroupModalProps> = ({
  isOpen,
  onClose,
  user, // Changed back from user_data to user
  onSave,
}) => {
  const [selected_group_id, setSelectedGroupId] = useState<string>(''); 
  const [available_groups, setAvailableGroups] = useState<Group[]>([]);
  const [loading_groups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available groups when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingGroups(true);
      setError(null); // Clear errors on open
      setSaving(false); // Clear saving on open
      fetch('/api/admin/groups')
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch groups');
            }
            return res.json();
        })
        .then(data => {
            // API returns snake_case groups
            setAvailableGroups(data.groups || []);
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

  // Update local state when user_data changes, ONLY if it actually changed
  useEffect(() => {
    if (user) {
      const currentGroupIdString = user.user_group_id !== null ? String(user.user_group_id) : '';
      setSelectedGroupId(currentGroupIdString); 
      setError(null);
      setSaving(false);
    } else {
      setSelectedGroupId('');
      setError(null);
      setSaving(false);
    }
  }, [user]);

  if (!isOpen || !user) return null; // Changed from user_data

  const handleSaveClick = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ 
          user_id: user.user_id,
          user_group_id: selected_group_id === '' ? null : parseInt(selected_group_id, 10) 
      });
      setSaving(false);
    } catch (err) {
      setError(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
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
          <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937', fontWeight: 500 }}>{user.user_name}</p>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#6b7280' }}>Email</p>
          <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{user.email}</p>
        </div>

        {/* Group Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="userGroup" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Assign Group
          </label>
          {loading_groups ? (
            <div style={{color: '#6b7280'}}>Loading groups...</div>
          ) : (
            <select
              id="userGroup"
              value={selected_group_id} 
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={loading_groups}
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #d1d5db', fontSize: '0.875rem', backgroundColor: 'white',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <option value="">-- No Group --</option> 
              {available_groups.map((group) => (
                <option key={group.user_group_id} value={String(group.user_group_id)}>
                  {group.user_group_name}
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
            disabled={saving} // Disable cancel while saving
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving || loading_groups} // Disable if saving or loading groups
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem',
              backgroundColor: saving ? '#9ca3af' : '#39A2DB', 
              color: 'white', border: 'none',
              cursor: (saving || loading_groups) ? 'not-allowed' : 'pointer',
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