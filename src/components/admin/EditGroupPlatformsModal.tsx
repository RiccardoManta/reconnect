'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RefreshCw, ShieldCheck } from 'lucide-react';

// Interface for the group data passed into the modal - now expects UserGroup (snake_case)
// Re-using UserGroup interface definition from AdminGroupsPage, assuming it will be imported or reconciled.
// For now, let's define it locally for clarity if this component were standalone.
interface UserGroup {
    user_group_id: number;
    user_group_name: string;
    accessible_platform_ids: string | null; 
    permission_id: number; 
    // permission_name is also part of UserGroup but not strictly needed for this modal's props
}

// Interface for Platform data fetched from API - now snake_case
interface Platform {
  platform_id: number;
  platform_name: string;
}

// Interface for Permission data fetched from API - now snake_case
interface Permission {
  permission_id: number;
  permission_name: string;
}

interface EditGroupPlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: UserGroup; // Changed from groupData, type is now snake_case UserGroup
  // Updated onSave to include permission_id (already snake_case from parent)
  onSave: (group_id: number, platform_ids: number[], permission_id: number) => Promise<void>; 
}

const EditGroupPlatformsModal: React.FC<EditGroupPlatformsModalProps> = ({
  isOpen,
  onClose,
  group, // Changed from groupData
  onSave,
}) => {
  // Platform state
  const [all_platforms, setAllPlatforms] = useState<Platform[]>([]); // snake_case state name
  const [loading_platforms, setLoadingPlatforms] = useState(false);
  const [selected_platform_ids, setSelectedPlatformIds] = useState<Set<number>>(new Set());

  // Permission state
  const [available_permissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading_permissions, setLoadingPermissions] = useState(false);
  const [selected_permission_id, setSelectedPermissionId] = useState<number | ''>(group?.permission_id ?? '');

  // General modal state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected IDs and permission when group changes
  useEffect(() => {
    if (group) {
        // Current state representation
        const currentPlatformIdsString = Array.from(selected_platform_ids).sort().join(',');
        const currentPermissionId = selected_permission_id === '' ? null : Number(selected_permission_id);
        
        // Incoming prop representation
        const incomingPlatformIds = group.accessible_platform_ids 
            ? group.accessible_platform_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)).sort().join(',')
            : '';
        const incomingPermissionId = group.permission_id;

        // Only update state and reset flags if incoming data is different
        if (incomingPlatformIds !== currentPlatformIdsString || incomingPermissionId !== currentPermissionId) {
            if (group.accessible_platform_ids) {
                const ids = group.accessible_platform_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
                setSelectedPlatformIds(new Set(ids));
            } else {
                setSelectedPlatformIds(new Set());
            }
            setSelectedPermissionId(group.permission_id ?? '');
            setError(null);
            setSaving(false);
        }
    } else {
        // Reset if group becomes null
        setSelectedPlatformIds(new Set());
        setSelectedPermissionId('');
        setError(null);
        setSaving(false);
    }
  }, [group]);

  // Fetch all available platforms AND permissions when the modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);

      // Fetch Platforms
      setLoadingPlatforms(true);
      fetch('/api/platforms') 
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch platforms'))
        .then(data => setAllPlatforms(data.platforms || [])) // API returns snake_case
        .catch(err => {
          console.error("Error fetching platforms:", err);
          setError(prev => prev ? prev + ' \nCould not load platforms.' : 'Could not load platforms.');
        })
        .finally(() => setLoadingPlatforms(false));

      // Fetch Permissions
      setLoadingPermissions(true);
      fetch('/api/admin/permissions') 
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch permissions'))
        .then(data => setAvailablePermissions(data.permissions || [])) // API returns snake_case
        .catch(err => {
          console.error("Error fetching permissions:", err);
          setError(prev => prev ? prev + ' \nCould not load permissions.' : 'Could not load permissions.');
        })
        .finally(() => setLoadingPermissions(false));
    }
  }, [isOpen]);

  // Handler for checkbox changes
  const handleCheckboxChange = useCallback((platform_id: number, isChecked: boolean) => {
      setSelectedPlatformIds(prevIds => {
          const newIds = new Set(prevIds);
          if (isChecked) {
              newIds.add(platform_id);
          } else {
              newIds.delete(platform_id);
          }
          return newIds;
      });
  }, []);

  // Handler for permission dropdown change
  const handlePermissionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setSelectedPermissionId(value === '' ? '' : parseInt(value, 10));
  };

  // Handler for save button click
  const handleSaveClick = async () => {
    // Ensure a valid permission is selected
    if (selected_permission_id === '' || isNaN(Number(selected_permission_id))) {
        setError('Please select a valid permission level.');
        return;
    }
    const permission_id_to_save = Number(selected_permission_id);

    setSaving(true);
    setError(null);
    try {
      const platform_ids_array = Array.from(selected_platform_ids);
      await onSave(group.user_group_id, platform_ids_array, permission_id_to_save);
    } catch (err) {
      setError(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error in EditGroupPlatformsModal save:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !group) return null;

  const isLoading = loading_platforms || loading_permissions;

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContainer}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit Group: "{group.user_group_name}"</h2>
          <button onClick={onClose} style={styles.closeButton} disabled={saving}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            {error.split('\n').map((line, i) => <p key={i} style={{margin:0}}>{line}</p>)}
          </div>
        )}

        {/* Permission Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="permission-select" style={styles.label}>Permission Level</label>
          {loading_permissions ? (
             <p style={{color: '#6b7280'}}>Loading permissions...</p>
          ) : available_permissions.length > 0 ? (
            <select
              id="permission-select"
              value={selected_permission_id}
              onChange={handlePermissionChange}
              disabled={saving}
              style={styles.selectInput}
            >
              <option value="" disabled>-- Select Permission --</option>
              {available_permissions.map((perm) => (
                <option key={perm.permission_id} value={perm.permission_id}>
                  {perm.permission_name}
                </option>
              ))}
            </select>
          ) : (
             <p style={{color: '#dc2626'}}>Could not load permissions.</p>
          )}
        </div>

        {/* Platform Checkbox List */}
         <div>
            <label style={styles.label}>Accessible Platforms</label>
            <div className="platform-list-container" style={styles.platformListContainer}>
            {loading_platforms ? (
                <p style={{color: '#6b7280', textAlign: 'center'}}>Loading platforms...</p>
            ) : all_platforms.length === 0 ? (
                <p style={{color: '#6b7280', textAlign: 'center'}}>No platforms found.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {all_platforms.map((platform) => (
                    <li key={platform.platform_id} style={styles.listItem}>
                    <label style={styles.checkboxLabel}>
                        <input
                        type="checkbox"
                        checked={selected_platform_ids.has(platform.platform_id)}
                        onChange={(e) => handleCheckboxChange(platform.platform_id, e.target.checked)}
                        disabled={saving}
                        style={styles.checkboxInput}
                        />
                        {platform.platform_name}
                    </label>
                    </li>
                ))}
                </ul>
            )}
            </div>
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
            disabled={saving || isLoading}
            style={(saving || isLoading) ? {...styles.buttonPrimary, ...styles.buttonDisabled} : styles.buttonPrimary}
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
        <style jsx>{`
            @keyframes spin {
                 from { transform: rotate(0deg); } 
                 to { transform: rotate(360deg); } 
            }
            .platform-list-container li:last-child {
                 border-bottom: none; 
            }
        `}</style>
      </div>
    </div>
  );
};

// Styles (potentially merge/refine later)
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
    maxWidth: '500px',
    maxHeight: '90vh',
    display: 'flex', 
    flexDirection: 'column' as const,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb',
    flexShrink: 0, 
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: 600, 
    color: '#111827', 
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' 
  },
  errorBox: {
    padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c',
    borderRadius: '0.25rem', marginBottom: '1rem', fontSize: '0.875rem',
    flexShrink: 0,
  },
  label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#374151',
  },
  selectInput: {
      width: '100%',
      padding: '0.6rem 0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '0.9rem',
      backgroundColor: 'white',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
  },
  platformListContainer: {
      marginBottom: '1.5rem', 
      maxHeight: '30vh', // Adjusted max height
      overflowY: 'auto' as const, 
      border: '1px solid #e5e7eb', 
      borderRadius: '0.375rem', 
      padding: '0.75rem' 
  },
  listItem: { 
      padding: '0.5rem 0', 
      borderBottom: '1px solid #f3f4f6' 
  },
  checkboxLabel: { 
      display: 'flex', 
      alignItems: 'center', 
      cursor: 'pointer', 
      fontSize: '0.9rem' 
  },
  checkboxInput: { 
      marginRight: '0.75rem', 
      height: '1rem', 
      width: '1rem' 
  },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
    paddingTop: '1.5rem', marginTop: 'auto',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  buttonPrimary: {
    display: 'inline-flex', // To align icon and text
    alignItems: 'center', 
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'white',
    backgroundColor: '#39A2DB',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
  },
  buttonSecondary: {
    padding: '0.6rem 1.2rem', 
    borderRadius: '0.375rem', 
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151', 
    backgroundColor: 'white', 
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
  },
  buttonDisabled: {
      backgroundColor: '#9ca3af', // Gray when disabled
      cursor: 'not-allowed',
      opacity: 0.7,
  },

};

// Ensure default export
export default EditGroupPlatformsModal; 