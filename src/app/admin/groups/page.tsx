'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, PlusCircle, RefreshCw, Settings } from 'lucide-react';
import { keysToCamel } from '@/utils/caseConverter';
// We need the User type definition
import { User } from '@/types/database'; 
// Import the new AddGroupModal
import AddGroupModal from '@/components/admin/AddGroupModal'; 
// Import the new EditGroupPlatformsModal
import EditGroupPlatformsModal from '@/components/admin/EditGroupPlatformsModal';

// Interface for Group data fetched from API - Added permissionId AND permissionName
interface UserGroup {
  userGroupId: number;
  userGroupName: string;
  accessiblePlatformNames: string | null;
  accessiblePlatformIds: string | null; // Need IDs for editing
  permissionId: number; 
  permissionName: string; // Added
}

// Interface for User data relevant to this page (matches AdminUsersPage for now)
interface AdminUserDisplay extends Pick<User, 'userId' | 'userName' | 'companyUsername' | 'email'> {
  userGroupId: number | null;
  userGroupName: string | null;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUserDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  // State for editing platforms modal
  const [editingGroupPlatforms, setEditingGroupPlatforms] = useState<UserGroup | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch groups and users in parallel
      const [groupsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/groups'),
        fetch('/api/admin/users') 
      ]);

      if (!groupsResponse.ok) {
        const errorData = await groupsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch groups');
      }
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const groupsData = await groupsResponse.json();
      const usersData = await usersResponse.json();

      // keysToCamel should handle permission_id -> permissionId and permission_name -> permissionName
      setGroups(keysToCamel<UserGroup[]>(groupsData.groups || []));
      setAllUsers(keysToCamel<AdminUserDisplay[]>(usersData.users || []));

    } catch (err) {
      const errorMsg = 'Error loading data: ' + (err instanceof Error ? err.message : String(err));
      setError(errorMsg);
      console.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to handle saving a new group
  const handleSaveNewGroup = async (newGroupName: string) => {
    setError(null);
    // Optional: Add specific loading state for saving group
    try {
        const response = await fetch('/api/admin/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupName: newGroupName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create group');
        }
        
        // Group created successfully
        setIsAddGroupModalOpen(false);
        await fetchData(); // Re-fetch to include the new group

    } catch (err) {
        console.error("Failed to create group:", err);
        // Set error state to display in the main page 
        // (or pass setError function to modal if you want error shown there)
        setError('Failed to create group: ' + (err instanceof Error ? err.message : 'Unknown error'));
        // Decide if modal should stay open on error
    }
  };

  const handleOpenAddModal = () => {
    setIsAddGroupModalOpen(true);
  };

  // Handler to open the edit platforms modal
  const handleOpenEditPlatformsModal = (group: UserGroup) => {
    setEditingGroupPlatforms(group);
  };

  // Updated function to save both platform and permission changes
  const handleSaveGroupChanges = async (groupId: number, platformIds: number[], permissionId: number) => {
    setError(null);
    let platformUpdateOk = false;
    let permissionUpdateOk = false;
    
    console.log(`Saving changes for group ${groupId}: Platforms=`, platformIds, `PermissionId=`, permissionId);
    
    // --- Start optimistic update or indicate saving --- 
    // (Optional: Could show a saving indicator on the specific group)

    try {
      // 1. Update Platforms API Call
       const platformResponse = await fetch(`/api/admin/groups/${groupId}/platforms`, { 
           method: 'PUT', 
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ platformIds: platformIds }),
       });
       if (!platformResponse.ok) {
           const errorData = await platformResponse.json();
           throw new Error(`Platform Update Failed: ${errorData.error || 'Unknown error'}`);
       }
       platformUpdateOk = true;
       console.log(`Group ${groupId} platform access updated successfully.`);

       // 2. Update Permission ID API Call
       const permissionResponse = await fetch(`/api/admin/groups/${groupId}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ permissionId: permissionId }),
       });
       if (!permissionResponse.ok) {
            const errorData = await permissionResponse.json();
            throw new Error(`Permission Update Failed: ${errorData.error || 'Unknown error'}`);
        }
        const updatedGroupData = await permissionResponse.json(); // Get updated group data
        permissionUpdateOk = true;
        console.log(`Group ${groupId} permission updated successfully.`);

        // 3. Update Local State Directly using the comprehensive data from the API response
        const updatedGroup = keysToCamel<UserGroup>(updatedGroupData.group); 
        if (updatedGroup) {
            // The API now returns permissionName and accessiblePlatformNames/Ids
            setGroups(prevGroups => 
                prevGroups.map(group => 
                    group.userGroupId === groupId ? updatedGroup : group // Directly use the updated group object
                )
            );
        } else {
            // Fallback remains the same
             console.warn("API did not return updated group data, falling back to refetch.");
             await fetchData(); 
        }

       setEditingGroupPlatforms(null); // Close modal AFTER state update
       
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Unknown error';
       console.error("Failed to save group changes:", errorMessage, err);
       
       // Provide more specific error feedback
       let finalError = 'Failed to save changes.';
       if (platformUpdateOk && !permissionUpdateOk) {
           finalError = `Platforms updated, but failed to update permission: ${errorMessage}`;
       } else if (!platformUpdateOk && !permissionUpdateOk) {
           finalError = `Failed to update platforms and permission: ${errorMessage}`;
       } // No need for platform failed, permission ok case as they run sequentially
       
       setError(finalError);
       // Keep modal open on error to allow retry or cancellation
    }
  };

  // Helper to get users for a specific group ID
  const getUsersInGroup = (groupId: number | null): AdminUserDisplay[] => {
    if (groupId === null) return []; // Or handle users with no group separately if needed
    return allUsers.filter(user => user.userGroupId === groupId);
  };

  // --- Helper functions for badge styles ---
  // Define consistent styles for all badges
  const baseBadgeStyle: React.CSSProperties = {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px', // Pill shape
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1.5'
  };

  // Function to get style based on permission name
  const getPermissionBadgeStyle = (permissionName: string | undefined | null): React.CSSProperties => {
      switch (permissionName?.toLowerCase()) {
          case 'admin':
              return { ...baseBadgeStyle, backgroundColor: '#FEE2E2', color: '#B91C1C' }; // Red
          case 'edit':
              return { ...baseBadgeStyle, backgroundColor: '#FEF3C7', color: '#B45309' }; // Yellow
          case 'read':
          case 'default':
          default:
              return { ...baseBadgeStyle, backgroundColor: '#E5E7EB', color: '#374151' }; // Gray
      }
  };

  // Function to get style for platform badges (consistent style for now)
  const getPlatformBadgeStyle = (): React.CSSProperties => {
      return { ...baseBadgeStyle, backgroundColor: '#DBEAFE', color: '#1E40AF' }; // Blue
  };
  // --- End Helper functions ---

  return (
    <div>
      {/* Page Header */}
       <div style={styles.headerContainer}>
         <div style={styles.headerTitleContainer}>
           <ShieldCheck size={28} style={styles.headerIcon} />
           <h1 style={styles.headerTitle}>Group Management</h1>
         </div>
         {/* Add Group Button */}
         <button 
           onClick={handleOpenAddModal} 
           style={{ 
               ...styles.addButton, // Keep existing base styles
               backgroundColor: '#39A2DB', // Override background color
               color: 'white' // Ensure text remains white
            }} 
           title="Add new group"
         >
           <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
           Add Group
         </button>
       </div>

        {/* Loading State */}
        {loading && (
            <div style={styles.loadingContainer}>
               <RefreshCw size={24} style={styles.loadingIcon} />
               <p>Loading groups and users...</p>
               <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        )}

        {/* Error State */}
        {!loading && error && (
            <div style={styles.errorContainer}>
               <p>{error}</p>
            </div>
        )}

        {/* Group Sections - Use flex wrap */}
        {!loading && !error && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {groups.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#6b7280', width: '100%' }}>No groups found.</p>
                )}
                {groups.map((group) => {
                    const usersInGroup = getUsersInGroup(group.userGroupId);
                    return (
                        <div key={group.userGroupId} style={styles.groupSection}>
                            <div style={styles.groupHeader}>
                                <h2 style={styles.groupHeadingNoBorder}>{group.userGroupName}</h2>
                                {/* Edit Group Button */}
                                <button 
                                   onClick={() => handleOpenEditPlatformsModal(group)}
                                   // Updated border/text color to light blue
                                   style={{ 
                                     ...styles.editButton, // Keep base styles
                                     backgroundColor: 'white', // Keep white background
                                     color: '#39A2DB', // Light blue text
                                     borderColor: '#39A2DB', // Light blue border
                                     borderWidth: '1px',
                                     borderStyle: 'solid',
                                     padding: '4px 8px', 
                                     fontSize: '0.8rem' 
                                   }}
                                   title="Edit Group Permissions & Platforms"
                                >
                                    <Settings size={14} style={{ marginRight: '0.25rem' }} />
                                    Edit Group
                                </button> 
                            </div>
                            
                            {/* Display Permission Name */}
                            <div style={{marginBottom: '0.5rem'}}>
                                <strong style={styles.subHeading}>Permission:</strong> 
                                {/* Apply styles based on permissionName */}
                                <span style={getPermissionBadgeStyle(group.permissionName)}>
                                    {group.permissionName || 'N/A'}
                                </span>
                            </div>

                            {/* Display Accessible Platforms */}
                            <div style={{marginBottom: '1rem'}}>
                                <strong style={styles.subHeading}>Accessible Platforms:</strong> 
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#374151', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
                                    {(group.accessiblePlatformNames && group.accessiblePlatformNames.split(',').map(name => name.trim()).filter(name => name)) ? (
                                      group.accessiblePlatformNames.split(',').map(name => name.trim()).filter(name => name).map((platformName, index) => (
                                         <span key={index} style={getPlatformBadgeStyle()}>
                                             {platformName}
                                         </span>
                                      ))
                                     ) : (
                                      <span style={{color: '#6b7280'}}>None</span>
                                     )}
                                </span>
                            </div>

                            <h3 style={styles.subHeading}>Users in this Group ({usersInGroup.length})</h3>
                            {usersInGroup.length > 0 ? (
                                <div style={styles.tableContainer}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr style={styles.tableHeaderRow}>
                                                <th style={styles.tableHeaderCell}>User Name</th>
                                                <th style={styles.tableHeaderCell}>Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersInGroup.map((user) => (
                                                <tr key={user.userId} style={styles.tableBodyRow}>
                                                    <td style={styles.tableBodyCell}>{user.userName}</td>
                                                    <td style={styles.tableBodyCell}>{user.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             ) : (
                                <p style={styles.noUsersText}>No users currently assigned to this group.</p>
                             )}
                        </div>
                    );
                })}
            </div>
        )}

      {/* Render Add Group Modal */}
      {isAddGroupModalOpen && (
        <AddGroupModal
          isOpen={isAddGroupModalOpen}
          onClose={() => setIsAddGroupModalOpen(false)}
          onSave={handleSaveNewGroup} 
        />
      )}

      {/* Render Edit Group Modal - Pass the updated handler */}
      {editingGroupPlatforms && (
        <EditGroupPlatformsModal
          isOpen={editingGroupPlatforms !== null}
          groupData={editingGroupPlatforms} // Pass group data including permissionId
          onClose={() => setEditingGroupPlatforms(null)}
          onSave={handleSaveGroupChanges} // Use the new handler
        />
      )}

    </div>
  );
}

// Updated styles
const styles = {
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem'
  },
  headerTitleContainer: {
    display: 'flex', 
    alignItems: 'center' 
  },
  headerIcon: {
    color: '#0F3460', 
    marginRight: '1rem' 
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#0F3460',
    margin: 0
  },
  addButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  loadingContainer: {
    display: 'flex', 
    flexDirection: 'column' as const, 
    alignItems: 'center', 
    padding: '2rem', 
    color: '#6b7280'
  },
  loadingIcon: {
    animation: 'spin 1s linear infinite', 
    marginBottom: '0.5rem'
  },
  errorContainer: {
    textAlign: 'center' as const, 
    padding: '1rem', 
    backgroundColor: '#fee2e2', 
    color: '#b91c1c', 
    borderRadius: '0.5rem', 
    fontSize: '0.875rem'
  },
  groupSection: {
    backgroundColor: 'white', 
    borderRadius: '0.5rem',
    padding: '1.5rem', 
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    width: 'calc(50% - 1rem)', // Fit two per row with 2rem gap
    boxSizing: 'border-box' as const, // Include padding/border in width calculation
    display: 'flex', // Use flex for internal layout
    flexDirection: 'column' as const, // Stack content vertically
  },
  groupHeader: { 
     display: 'flex', 
     justifyContent: 'space-between', 
     alignItems: 'flex-start', // Align items to top
     borderBottom: '1px solid #e5e7eb', 
     paddingBottom: '0.75rem', 
     marginBottom: '1rem' 
  },
  groupHeadingNoBorder: {
    fontSize: '1.25rem', 
    fontWeight: 600, 
    color: '#111827', 
    margin: 0, 
    marginRight: '1rem' // Add some space before the button
  },
  editButton: {
    backgroundColor: '#eef2ff', 
    color: '#4338ca', 
    border: '1px solid #c7d2fe', 
    borderRadius: '0.375rem',
    padding: '0.35rem 0.7rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    fontWeight: 500,
    transition: 'background-color 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0 // Prevent button shrinking
  },
  subHeading: {
      fontSize: '0.9rem',
      fontWeight: 600, 
      color: '#4b5563',
      marginBottom: '0.75rem',
      display: 'inline-block'
  },
  tableContainer: {
      overflowX: 'auto' as const,
      flexGrow: 1 // Allow table container to grow if needed
  },
  table: {
    width: '100%', 
    borderCollapse: 'collapse' as const
  },
  tableHeaderRow: {
    borderBottom: '1px solid #e5e7eb', 
    backgroundColor: '#f9fafb'
  },
  tableHeaderCell: {
    padding: '0.75rem 1rem', 
    textAlign: 'left' as const, 
    fontSize: '0.875rem', 
    fontWeight: 600, 
    color: '#4b5563'
  },
  tableBodyRow: {
    borderBottom: '1px solid #e5e7eb'
  },
  tableBodyCell: {
    padding: '0.75rem 1rem', 
    fontSize: '0.875rem', 
    color: '#111827'
  },
  noUsersText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontStyle: 'italic'
  }
}; 