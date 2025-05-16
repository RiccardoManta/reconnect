'use client';

import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, RefreshCw, UserPlus, PlusCircle } from 'lucide-react';
// Import User type (contains basic fields)
import { User } from '@/types/database'; 
// import { keysToCamel } from '@/utils/caseConverter'; // Removed unused keysToSnake
// Import the modal component and its exported UserData type correctly
import EditUserGroupModal, { ModalUserData } from '@/components/admin/EditUserGroupModal';
// Import the new AddUserModal
import AddUserModal, { NewUserData as AddUserModalData } from '@/components/admin/AddUserModal'; // Renamed import type

// Updated interface to match API response (now snake_case)
interface AdminUserDisplay extends Pick<User, 'user_id' | 'user_name' | 'company_username' | 'email'> {
  user_group_id: number | null; 
  user_group_name: string | null; 
  permission_name?: string | null; // Added permission_name
}

// Placeholder for the AddUserModal props if needed for handleSaveNewUser
// interface NewUserData { 
//   userName: string;
//   companyUsername?: string | null;
//   email: string;
//   password?: string; // Added password for creation
//   userGroupId: number | null;
// }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected_user, setSelectedUser] = useState<AdminUserDisplay | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State for Add User modal

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users'); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data = await response.json();
      // API returns user_group_id and user_group_name (snake_case)
      setUsers(data.users || []); // API returns snake_case, AdminUserDisplay is snake_case
    } catch (err) {
      setError('Error loading users: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update signature to match modal's onSave expectation (user_id, group_id)
  // Modal now should also use snake_case: user_id, user_group_id
  const handleSaveChanges = async (data: { user_id: number; user_group_id: number | null }) => {
    // Find the user being edited
    const userToUpdate = users.find(u => u.user_id === data.user_id);
    if (!userToUpdate) return;

    console.log(`Saving changes for user ${data.user_id}: GroupId=`, data.user_group_id);
    setError(null); // Clear previous errors

    try {
        const response = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: data.user_id, 
                user_group_id: data.user_group_id // API expects user_group_id
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user group');
        }
        const result = await response.json();
        
        // API returns updated user with user_group_id and user_group_name (snake_case)
        const updated_user = result.user as AdminUserDisplay;
        
        // Update local state directly
        if (updated_user) {
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.user_id === updated_user.user_id ? updated_user : u
                )
            );
            console.log(`User ${data.user_id} group updated locally.`);
        } else {
            // Fallback if API doesn't return updated user
            console.warn("API did not return updated user data, falling back to refetch.");
            await fetchData(); 
        }
        
        // Important: Close the modal AFTER successful state update
        setSelectedUser(null); 

    } catch (err) {
        console.error("Failed to save user group:", err);
        const errorMsg = 'Failed to save group: ' + (err instanceof Error ? err.message : 'Unknown error');
        setError(errorMsg);
        // Don't rollback optimistic update here, let modal show error and user retry/cancel
        // setUsers(originalUsers); // Avoid rollback on error
        // Keep modal open by not setting selectedUser to null
        // setSelectedUser(null); 
    }
    // Note: We don't set saving state here as the modal handles its own saving state
  };

  // Update function signature to use imported type
  const handleSaveNewUser = async (newUserData: AddUserModalData) => {
    console.log("Saving new user:", newUserData); 
    setError(null);
    // Indicate loading state if desired (optional)
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST', // Use POST method
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserData), // Send collected data
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Display specific error from API if available
            throw new Error(errorData.error || 'Failed to create user'); 
        }
        
        // User created successfully
        setIsAddModalOpen(false); 
        await fetchData(); // Re-fetch to include the new user
        // Consider optimistic update for better UX later

    } catch (err) {
        console.error("Failed to create user:", err);
        // Set error state to display in the main page or modal
        setError('Failed to create user: ' + (err instanceof Error ? err.message : 'Unknown error'));
        // Keep the modal open if there was an error? Or rely on modal's internal error display?
        // For now, we close it in the parent, but modal handles its own errors too.
        // setIsAddModalOpen(false); 
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

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
    table: {
      width: '100%',
      borderCollapse: 'collapse' as 'collapse',
    },
    tableHeaderCell: {
      padding: '0.75rem 1rem',
      textAlign: 'left' as 'left',
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#4b5563'
    },
    tableBodyRow: {
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s',
      cursor: 'pointer'
    },
    tableBodyCell: {
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      color: '#111827'
    }
  };

  return (
    <div>
      {/* Page Header */}
       <div style={styles.headerContainer}>
         <div style={styles.headerTitleContainer}>
           <UsersIcon size={28} style={styles.headerIcon} /> 
           <h1 style={styles.headerTitle}>User Management {users.length > 0 ? `(${users.length})` : ''}</h1>
         </div>
         {/* Add User Button */}
         <button 
           onClick={handleOpenAddModal} 
           style={{ 
               ...styles.addButton, // Keep existing base styles
               backgroundColor: '#39A2DB', // Override background color
               color: 'white' // Ensure text remains white
            }} 
           title="Add new user"
         >
           <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
           Add User
         </button>
       </div>

      {/* User Table Container */}
       <div style={{
         backgroundColor: 'white', borderRadius: '0.5rem',
         boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto'
       }}>
         {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' }}>
               <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
               <p style={{ margin: 0 }}>Loading users...</p>
               <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
             </div>
         ) : error ? (
             <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
               <p>{error}</p>
             </div>
         ) : (
           <table style={styles.table}>
             <thead>
               <tr>
                 <th style={styles.tableHeaderCell}>Username</th>
                 <th style={styles.tableHeaderCell}>Company Username</th>
                 <th style={styles.tableHeaderCell}>Email</th>
                 <th style={styles.tableHeaderCell}>Group</th>
                 <th style={styles.tableHeaderCell}>Permission</th>
               </tr>
             </thead>
             <tbody>
               {users.length === 0 ? (
                 <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No users found</td></tr>
               ) : (
                 users.map((user) => (
                   <tr 
                     key={user.user_id} 
                     style={styles.tableBodyRow} 
                     onClick={() => setSelectedUser(user)}
                     onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f8ff')}
                     onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                   >
                     <td style={styles.tableBodyCell}>{user.user_name}</td>
                     <td style={styles.tableBodyCell}>{user.company_username || '-'}</td>
                     <td style={styles.tableBodyCell}>{user.email}</td>
                     <td style={styles.tableBodyCell}>{user.user_group_name || 'N/A'}</td>
                     <td style={styles.tableBodyCell}>{user.permission_name || 'N/A'}</td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         )}
       </div>

      {/* Edit User Group Modal */}
      {selected_user && (
        <EditUserGroupModal
          user={selected_user}
          isOpen={!!selected_user}
          onClose={() => setSelectedUser(null)}
          onSave={handleSaveChanges}
        />
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewUser} 
        />
      )}
      
    </div>
  );
} 