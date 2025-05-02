'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RefreshCw, ShieldCheck } from 'lucide-react';
import { keysToCamel } from '@/utils/caseConverter';

// Interface for the group data passed into the modal
interface GroupData {
    userGroupId: number;
    userGroupName: string;
    accessiblePlatformIds: string | null; // Comma-separated string of IDs
    permissionId: number; // Added current permission ID
}

// Interface for Platform data fetched from API
interface Platform {
  platformId: number;
  platformName: string;
}

// Interface for Permission data fetched from API
interface Permission {
  permissionId: number;
  permissionName: string;
}

interface EditGroupPlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: GroupData;
  // Updated onSave to include permissionId
  onSave: (groupId: number, platformIds: number[], permissionId: number) => Promise<void>; 
}

const EditGroupPlatformsModal: React.FC<EditGroupPlatformsModalProps> = ({
  isOpen,
  onClose,
  groupData,
  onSave,
}) => {
  // Platform state
  const [allPlatforms, setAllPlatforms] = useState<Platform[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<number>>(new Set());

  // Permission state
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | ''>(groupData?.permissionId ?? '');

  // General modal state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected IDs and permission when groupData changes
  useEffect(() => {
    if (groupData) {
        // Current state representation
        const currentPlatformIdsString = Array.from(selectedPlatformIds).sort().join(',');
        const currentPermissionId = selectedPermissionId === '' ? null : Number(selectedPermissionId);
        
        // Incoming prop representation
        const incomingPlatformIds = groupData.accessiblePlatformIds 
            ? groupData.accessiblePlatformIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)).sort().join(',')
            : '';
        const incomingPermissionId = groupData.permissionId;

        // Only update state and reset flags if incoming data is different
        if (incomingPlatformIds !== currentPlatformIdsString || incomingPermissionId !== currentPermissionId) {
            if (groupData.accessiblePlatformIds) {
                const ids = groupData.accessiblePlatformIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
                setSelectedPlatformIds(new Set(ids));
            } else {
                setSelectedPlatformIds(new Set());
            }
            setSelectedPermissionId(groupData.permissionId ?? '');
            setError(null);
            setSaving(false);
        }
    } else {
        // Reset if groupData becomes null
        setSelectedPlatformIds(new Set());
        setSelectedPermissionId('');
        setError(null);
        setSaving(false);
    }
  }, [groupData]);

  // Fetch all available platforms AND permissions when the modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);

      // Fetch Platforms
      setLoadingPlatforms(true);
      fetch('/api/platforms') 
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch platforms'))
        .then(data => setAllPlatforms(keysToCamel<Platform[]>(data.platforms || [])))
        .catch(err => {
          console.error("Error fetching platforms:", err);
          setError(prev => prev ? prev + ' \nCould not load platforms.' : 'Could not load platforms.');
        })
        .finally(() => setLoadingPlatforms(false));

      // Fetch Permissions
      setLoadingPermissions(true);
      fetch('/api/admin/permissions') 
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch permissions'))
        .then(data => setAvailablePermissions(keysToCamel<Permission[]>(data.permissions || [])))
        .catch(err => {
          console.error("Error fetching permissions:", err);
          setError(prev => prev ? prev + ' \nCould not load permissions.' : 'Could not load permissions.');
        })
        .finally(() => setLoadingPermissions(false));
    }
  }, [isOpen]);

  // Handler for checkbox changes
  const handleCheckboxChange = useCallback((platformId: number, isChecked: boolean) => {
      setSelectedPlatformIds(prevIds => {
          const newIds = new Set(prevIds);
          if (isChecked) {
              newIds.add(platformId);
          } else {
              newIds.delete(platformId);
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
    if (selectedPermissionId === '' || isNaN(Number(selectedPermissionId))) {
        setError('Please select a valid permission level.');
        return;
    }
    const permissionIdToSave = Number(selectedPermissionId);

    setSaving(true);
    setError(null);
    try {
      const platformIdsArray = Array.from(selectedPlatformIds);
      await onSave(groupData.userGroupId, platformIdsArray, permissionIdToSave);
    } catch (err) {
      setError(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error in EditGroupPlatformsModal save:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !groupData) return null;

  const isLoading = loadingPlatforms || loadingPermissions;

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContainer}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit Group: "{groupData.userGroupName}"</h2>
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
          {loadingPermissions ? (
             <p style={{color: '#6b7280'}}>Loading permissions...</p>
          ) : availablePermissions.length > 0 ? (
            <select
              id="permission-select"
              value={selectedPermissionId}
              onChange={handlePermissionChange}
              disabled={saving}
              style={styles.selectInput}
            >
              <option value="" disabled>-- Select Permission --</option>
              {availablePermissions.map((perm) => (
                <option key={perm.permissionId} value={perm.permissionId}>
                  {perm.permissionName}
                </option>
              ))}
            </select>
          ) : (
             <p style={{color: '#dc2626'}}>Could not load permissions.</p>
          )}
        </div>

        {/* Platform Checkbox List */}
         <div>
            <label style={styles.label}>Platform Access</label>
            <div className="platform-list-container" style={styles.platformListContainer}>
            {loadingPlatforms ? (
                <p style={{color: '#6b7280', textAlign: 'center'}}>Loading platforms...</p>
            ) : allPlatforms.length === 0 ? (
                <p style={{color: '#6b7280', textAlign: 'center'}}>No platforms found.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {allPlatforms.map((platform) => (
                    <li key={platform.platformId} style={styles.listItem}>
                    <label style={styles.checkboxLabel}>
                        <input
                        type="checkbox"
                        checked={selectedPlatformIds.has(platform.platformId)}
                        onChange={(e) => handleCheckboxChange(platform.platformId, e.target.checked)}
                        disabled={saving}
                        style={styles.checkboxInput}
                        />
                        {platform.platformName}
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