'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Users, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { User } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// --- Reusable Modal Field Type Definitions ---
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      // Convert incoming snake_case keys to camelCase
      setUsers(keysToCamel<User[]>(data.users || []));
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

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Convert outgoing camelCase keys to snake_case for the API
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }

      // Refresh data - API returns snake_case, convert to camelCase
      const savedData = await response.json();
      const newUser = keysToCamel<User>(savedData.user);
      setUsers(prev => [...prev, newUser]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save user:", err);
      throw err;
    }
  };

  const handleUpdateUser = async (formData: Record<string, any>) => {
    try {
      // Ensure userId is present (already camelCase from modal)
      if (!formData.userId) {
        throw new Error('User ID is required');
      }

      // Convert outgoing camelCase keys to snake_case for the API
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // API returns the updated record in snake_case, convert to camelCase
      const data = await response.json();
      const updatedUser = keysToCamel<User>(data.user);

      // Update local state with camelCase data
      setUsers(prev =>
        prev.map(user =>
          user.userId === updatedUser.userId ? updatedUser : user
        )
      );

      // Update selected user with camelCase data
      if (selectedUser?.userId === updatedUser.userId) {
         setSelectedUser(updatedUser);
      }

    } catch (err) {
      console.error("Failed to update user:", err);
      throw err;
    }
  };

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'userName', label: 'User Name', type: 'text', required: true },
    { name: 'companyUsername', label: 'Company Username', type: 'text' },
    { name: 'email', label: 'Email', type: 'text', required: true },
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'userId', label: 'User ID', type: 'number', editable: false },
    { name: 'userName', label: 'User Name', type: 'text', required: true, editable: true },
    { name: 'companyUsername', label: 'Company Username', type: 'text', editable: true },
    { name: 'email', label: 'Email', type: 'text', required: true, editable: true },
  ];

  // --- Styles ---
  const styles: { [key: string]: CSSProperties } = {
    headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    headerTitleContainer: { display: 'flex', alignItems: 'center' },
    headerIcon: { color: '#0F3460', marginRight: '1rem' },
    headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
    addButton: { border: 'none', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#0F3460', color: 'white' },
    tableContainer: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
    loadingSpinner: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
    errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
    tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
    tableBodyRow: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' },
    tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Users size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Users {users.length > 0 ? `(${users.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new user"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add User
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading users...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>User Name</th>
                <th style={styles.tableHeaderCell}>Company Username</th>
                <th style={styles.tableHeaderCell}>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId}
                    style={styles.tableBodyRow}
                    onClick={() => setSelectedUser(user)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{user.userId}</td>
                    <td style={styles.tableBodyCell}>{user.userName}</td>
                    <td style={styles.tableBodyCell}>{user.companyUsername || '-'}</td>
                    <td style={styles.tableBodyCell}>{user.email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <EditableDetailsModal
          isOpen={selectedUser !== null}
          onClose={() => setSelectedUser(null)}
          title={`User Details: ${selectedUser.userName}`}
          data={selectedUser}
          fields={detailsFields}
          onSave={handleUpdateUser}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New User"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 