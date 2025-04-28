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

// Interface for Group data fetched from API
interface UserGroup {
  userGroupId: number;
  userGroupName: string;
  accessiblePlatformNames: string | null;
  accessiblePlatformIds: string | null; // Need IDs for editing
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

      // API returns user_group_id, user_group_name (snake_case)
      setGroups(keysToCamel<UserGroup[]>(groupsData.groups || []));
      // API returns user data including user_group_id, user_group_name (snake_case)
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

  // Function to save platform changes
  const handleSaveGroupPlatforms = async (groupId: number, platformIds: number[]) => {
    setError(null);
    // Optional: Add specific loading state
    console.log(`Saving platforms for group ${groupId}:`, platformIds); 
    try {
       const response = await fetch(`/api/admin/groups/${groupId}/platforms`, { // Use dynamic route
           method: 'PUT', 
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ platformIds: platformIds }), // Send the array of IDs
       });

       if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || 'Failed to update platform access');
       }

       setEditingGroupPlatforms(null); // Close modal on success
       await fetchData(); // Refresh data
       
    } catch (err) {
       console.error("Failed to save platforms:", err);
       setError('Failed to save platform access: ' + (err instanceof Error ? err.message : 'Unknown error'));
       // Keep modal open on error?
    }
  };

  // Helper to get users for a specific group ID
  const getUsersInGroup = (groupId: number | null): AdminUserDisplay[] => {
    if (groupId === null) return []; // Or handle users with no group separately if needed
    return allUsers.filter(user => user.userGroupId === groupId);
  };

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
           style={styles.addButton}
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

        {/* Group Sections */}
        {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {groups.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>No groups found.</p>
                )}
                {groups.map((group) => {
                    const usersInGroup = getUsersInGroup(group.userGroupId);
                    return (
                        <div key={group.userGroupId} style={styles.groupSection}>
                            <div style={styles.groupHeader}>
                                <h2 style={styles.groupHeadingNoBorder}>{group.userGroupName} (ID: {group.userGroupId})</h2>
                                <button 
                                   onClick={() => handleOpenEditPlatformsModal(group)}
                                   style={styles.editButton}
                                   title="Edit accessible platforms"
                                >
                                    <Settings size={16} style={{ marginRight: '0.25rem' }} />
                                    Edit Platforms
                                </button> 
                            </div>
                            
                            <div style={{marginBottom: '1rem'}}>
                                <strong style={styles.subHeading}>Accessible Platforms:</strong> 
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                                    {group.accessiblePlatformNames || 'None'}
                                </span>
                            </div>

                            <h3 style={styles.subHeading}>Users in this Group ({usersInGroup.length})</h3>
                            {usersInGroup.length > 0 ? (
                                <div style={styles.tableContainer}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr style={styles.tableHeaderRow}>
                                                <th style={styles.tableHeaderCell}>User ID</th>
                                                <th style={styles.tableHeaderCell}>User Name</th>
                                                <th style={styles.tableHeaderCell}>Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersInGroup.map((user) => (
                                                <tr key={user.userId} style={styles.tableBodyRow}>
                                                    <td style={styles.tableBodyCell}>{user.userId}</td>
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

      {/* Render Edit Platforms Modal */}
      {editingGroupPlatforms && (
        <EditGroupPlatformsModal
          isOpen={editingGroupPlatforms !== null}
          groupData={editingGroupPlatforms} // Pass group data including current platforms
          onClose={() => setEditingGroupPlatforms(null)}
          onSave={handleSaveGroupPlatforms} 
        />
      )}

    </div>
  );
}

// Basic styles object (can be refined later)
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
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  groupHeader: {
     display: 'flex', 
     justifyContent: 'space-between', 
     alignItems: 'flex-start', 
     borderBottom: '1px solid #e5e7eb', 
     paddingBottom: '0.75rem', 
     marginBottom: '1rem' 
  },
  groupHeadingNoBorder: {
    fontSize: '1.25rem', 
    fontWeight: 600, 
    color: '#111827', 
    margin: 0 
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
    whiteSpace: 'nowrap'
  },
  subHeading: {
      fontSize: '0.9rem',
      fontWeight: 600, 
      color: '#4b5563',
      marginBottom: '0.75rem',
      display: 'inline-block'
  },
  tableContainer: {
      overflowX: 'auto' as const
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