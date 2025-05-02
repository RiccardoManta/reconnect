'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Package, RefreshCw, PlusCircle, Trash2 } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { Software } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// --- Reusable Modal Field Type Definitions ---
// (Ideally move to a shared file if not already done)
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function SoftwareList() {
  const [softwareList, setSoftwareList] = useState<Software[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSoftware, setSelectedSoftware] = useState<Software | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/software');
      if (!response.ok) {
        throw new Error('Failed to fetch software list');
      }
      const data = await response.json();
      setSoftwareList(keysToCamel<Software[]>(data.software || []));
    } catch (err) {
      setError('Error loading software: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching software:', err);
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

  const handleRowClick = (software: Software) => {
    setSelectedSoftware(software);
  };

  // --- API Call Handlers for Save, Update, Delete ---
  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add software');
      }

      const savedData = await response.json();
      const newSoftware = keysToCamel<Software>(savedData.software);

      // Add to local state and refresh/re-sort if needed
      setSoftwareList(prev => [...prev, newSoftware].sort((a, b) => 
        a.softwareName.localeCompare(b.softwareName) || (a.majorVersion ?? '').localeCompare(b.majorVersion ?? '')
      ));
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save software:", err);
      throw err;
    }
  };

  const handleUpdateSoftware = async (formData: Record<string, any>) => {
    try {
      const softwareId = formData.softwareId;
      if (!softwareId) {
        throw new Error('Software ID is required for update.');
      }

      const snakeCaseData = keysToSnake(formData);
      
      const response = await fetch(`/api/software/${softwareId}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update software');
      }

      const data = await response.json();
      const updatedSoftware = keysToCamel<Software>(data.software);

      // Update local state 
      setSoftwareList(prev =>
        prev.map(sw =>
          sw.softwareId === updatedSoftware.softwareId ? updatedSoftware : sw
        ).sort((a, b) => 
          a.softwareName.localeCompare(b.softwareName) || (a.majorVersion ?? '').localeCompare(b.majorVersion ?? '')
        )
      );

      // Update selected state only if it matches
      if (selectedSoftware?.softwareId === updatedSoftware.softwareId) {
           setSelectedSoftware(updatedSoftware);
      }
      // Close the modal on success by default when updating from the modal
      // If the update was triggered differently, this might need adjustment
      setSelectedSoftware(null); 

    } catch (err) {
      console.error("Failed to update software:", err);
      throw err;
    }
  };

  const handleDeleteSoftware = async (id: number | undefined) => {
    if (id === undefined) {
        console.error("Delete failed: ID is undefined");
        // Consider showing error in a less intrusive way (toast)
        // alert("Cannot delete: Software ID is missing.");
        return;
    }
    if (!confirm(`Are you sure you want to delete software ID ${id}? This might affect related licenses.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/software/${id}`, { 
            method: 'DELETE' 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete software');
        }

        // Remove from local state
        setSoftwareList(prev => prev.filter(sw => sw.softwareId !== id));
        setSelectedSoftware(null); // Close modal 
        // Optional: Show success message (toast)
        // alert('Software deleted successfully.');

    } catch (err) {
        console.error("Failed to delete software:", err);
        // Display error to user (toast)
        // alert('Failed to delete software: ' + (err instanceof Error ? err.message : String(err)));
        // Optionally re-throw or handle differently in the modal
        throw err; 
    }
  };
  // --- End API Call Handlers ---

  // Define fields for the Add modal (camelCase)
  const addEntryFields: ModalField[] = [
    { name: 'softwareName', label: 'Software Name', type: 'text', required: true },
    { name: 'majorVersion', label: 'Major Version', type: 'text' },
    { name: 'vendor', label: 'Vendor', type: 'text' },
  ];

  // Define fields for the Details/Edit modal (camelCase)
  const detailsFields: ModalField[] = [
    { name: 'softwareId', label: 'Software ID', type: 'number', editable: false },
    { name: 'softwareName', label: 'Software Name', type: 'text', required: true, editable: true },
    { name: 'majorVersion', label: 'Major Version', type: 'text', editable: true },
    { name: 'vendor', label: 'Vendor', type: 'text', editable: true },
  ];

  // --- Styles --- 
  const styles: { [key: string]: CSSProperties } = {
    headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    headerTitleContainer: { display: 'flex', alignItems: 'center' },
    headerIcon: { color: '#0F3460', marginRight: '1rem' },
    headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
    addButton: { 
        border: 'none', 
        borderRadius: '0.375rem', 
        padding: '0.5rem 0.75rem', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        fontSize: '0.875rem', 
        fontWeight: 500, 
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
        backgroundColor: '#39A2DB',
        color: 'white' 
    },
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
          <Package size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Software Catalog {softwareList.length > 0 ? `(${softwareList.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new software"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add Software
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading software...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Version</th>
                <th style={styles.tableHeaderCell}>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {softwareList.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No software found</td></tr>
              ) : (
                // Sort list for consistent display
                [...softwareList].sort((a, b) => 
                  a.softwareName.localeCompare(b.softwareName) || (a.majorVersion ?? '').localeCompare(b.majorVersion ?? '')
                ).map((sw) => (
                  <tr key={sw.softwareId}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(sw)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{sw.softwareId}</td>
                    <td style={styles.tableBodyCell}>{sw.softwareName}</td>
                    <td style={styles.tableBodyCell}>{sw.majorVersion || '-'}</td>
                    <td style={styles.tableBodyCell}>{sw.vendor || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selectedSoftware && (
        <EditableDetailsModal
          isOpen={selectedSoftware !== null}
          onClose={() => setSelectedSoftware(null)}
          title={`Software Details: ${selectedSoftware.softwareName}`}
          data={selectedSoftware}
          fields={detailsFields}
          onSave={handleUpdateSoftware}
        >
        </EditableDetailsModal>
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Software"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 