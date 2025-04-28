'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { keysToCamel } from '@/utils/caseConverter';

// Interface for the group data passed into the modal
interface GroupData {
    userGroupId: number;
    userGroupName: string;
    accessiblePlatformIds: string | null; // Comma-separated string of IDs
}

// Interface for Platform data fetched from API
interface Platform {
  platformId: number;
  platformName: string;
}

interface EditGroupPlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupData: GroupData;
  // onSave passes back the group ID and an array of selected platform numeric IDs
  onSave: (groupId: number, platformIds: number[]) => Promise<void>; 
}

const EditGroupPlatformsModal: React.FC<EditGroupPlatformsModalProps> = ({
  isOpen,
  onClose,
  groupData,
  onSave,
}) => {
  // State for all available platforms
  const [allPlatforms, setAllPlatforms] = useState<Platform[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  
  // State for currently selected platform IDs (using a Set for efficient add/delete)
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<number>>(new Set());

  // General modal state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected IDs when groupData changes
  useEffect(() => {
      if (groupData?.accessiblePlatformIds) {
          const ids = groupData.accessiblePlatformIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
          setSelectedPlatformIds(new Set(ids));
      } else {
          setSelectedPlatformIds(new Set());
      }
  }, [groupData]);

  // Fetch all available platforms when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingPlatforms(true);
      setError(null);
      setSaving(false);

      fetch('/api/platforms') // Assuming this endpoint exists and returns { platforms: [...] }
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch platforms');
          }
          return res.json();
        })
        .then(data => {
          // API returns platform_id, platform_name -> keysToCamel -> platformId, platformName
          setAllPlatforms(keysToCamel<Platform[]>(data.platforms || []));
        })
        .catch(err => {
          console.error("Error fetching platforms:", err);
          setError('Could not load platforms list.');
        })
        .finally(() => {
          setLoadingPlatforms(false);
        });
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

  // Handler for save button click
  const handleSaveClick = async () => {
    setSaving(true);
    setError(null);
    try {
      // Convert Set back to an array of numbers for the API call
      const platformIdsArray = Array.from(selectedPlatformIds);
      await onSave(groupData.userGroupId, platformIdsArray);
      // Parent component should handle closing
    } catch (err) {
      setError(`Failed to save platform access: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error in EditGroupPlatformsModal save:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !groupData) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContainer}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit Platform Access for "{groupData.userGroupName}"</h2>
          <button onClick={onClose} style={styles.closeButton} disabled={saving}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Platform Checkbox List */}
        <div className="platform-list-container" style={{ marginBottom: '1.5rem', maxHeight: '40vh', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem' }}>
          {loadingPlatforms ? (
            <p style={{color: '#6b7280', textAlign: 'center'}}>Loading platforms...</p>
          ) : allPlatforms.length === 0 ? (
             <p style={{color: '#6b7280', textAlign: 'center'}}>No platforms found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {allPlatforms.map((platform) => (
                <li key={platform.platformId} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedPlatformIds.has(platform.platformId)}
                      onChange={(e) => handleCheckboxChange(platform.platformId, e.target.checked)}
                      disabled={saving}
                      style={{ marginRight: '0.75rem', height: '1rem', width: '1rem' }}
                    />
                    {platform.platformName}
                  </label>
                </li>
              ))}
            </ul>
          )}
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
            disabled={saving || loadingPlatforms}
            style={(saving || loadingPlatforms) ? {...styles.buttonPrimary, ...styles.buttonDisabled} : styles.buttonPrimary}
          >
            {saving ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Platform Access
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

// Reusing styles from other modals
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
    display: 'flex', // Use flex column for structure
    flexDirection: 'column' as const,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb',
    flexShrink: 0, // Prevent header/footer from shrinking
  },
  modalTitle: {
    fontSize: '1.15rem', // Slightly smaller title
    fontWeight: 600, 
    color: '#111827', 
    margin: 0,
    overflow: 'hidden', // Prevent long names breaking layout
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
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
    paddingTop: '1.5rem', marginTop: 'auto', // Push footer to bottom
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  buttonPrimary: {
    padding: '0.5rem 1rem', 
    borderRadius: '0.375rem', 
    fontSize: '0.875rem',
    backgroundColor: '#2563eb', // Blue for save actions
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

export default EditGroupPlatformsModal; 