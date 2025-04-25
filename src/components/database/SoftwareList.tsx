'use client';

import React, { useState } from 'react';
import { BookOpen, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { Software } from '../../types/database'; // Assuming camelCase version
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/software'); // API endpoint for software
      if (!response.ok) {
        throw new Error('Failed to fetch software list');
      }
      const data = await response.json();
      // Convert incoming snake_case keys (from API) to camelCase (for frontend state)
      setSoftwareList(keysToCamel<Software[]>(data.software || []));
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading software: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching software:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddModalOpen(true);
  };

  const handleRowClick = (software: Software) => {
    setSelectedSoftware(software);
  };

  // --- API Call Handlers for Save, Update, Delete ---
  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Convert outgoing camelCase keys to snake_case for the API
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

      // API should return the new software item (snake_case)
      const savedData = await response.json();
      const newSoftware = keysToCamel<Software>(savedData.software); // Convert back to camelCase

      // Add to local state and refresh/re-sort if needed
      setSoftwareList(prev => [...prev, newSoftware].sort((a, b) => 
        a.softwareName.localeCompare(b.softwareName) || (a.majorVersion ?? '').localeCompare(b.majorVersion ?? '')
      ));
      setIsAddModalOpen(false); // Close modal on success

    } catch (err) {
      console.error("Failed to save software:", err);
      // Display error to user? (e.g., using a toast notification library)
      throw err; // Re-throw to prevent modal from closing automatically on error
    }
  };

  const handleUpdateSoftware = async (formData: Record<string, any>) => {
    try {
      // Ensure softwareId is present (it's needed for the URL)
      const softwareId = formData.softwareId;
      if (!softwareId) {
        throw new Error('Software ID is required for update.');
      }

      // Convert outgoing camelCase keys to snake_case
      const snakeCaseData = keysToSnake(formData);
      
      const response = await fetch(`/api/software/${softwareId}`, { // Use ID in URL
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData), // Body still contains all fields for update
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update software');
      }

      // API should return the updated software item (snake_case)
      const data = await response.json();
      const updatedSoftware = keysToCamel<Software>(data.software); // Convert back to camelCase

      // Update local state with camelCase data
      setSoftwareList(prev =>
        prev.map(sw =>
          sw.softwareId === updatedSoftware.softwareId ? updatedSoftware : sw
        ).sort((a, b) => 
          a.softwareName.localeCompare(b.softwareName) || (a.majorVersion ?? '').localeCompare(b.majorVersion ?? '')
        )
      );

      setSelectedSoftware(null); // Close modal on success

    } catch (err) {
      console.error("Failed to update software:", err);
      throw err; // Re-throw to prevent modal from closing automatically
    }
  };

  // Note: Delete is often handled by a button *within* the Edit modal or directly on the row
  // This example assumes it's called from the Edit modal context for simplicity
  const handleDeleteSoftware = async (id: number | undefined) => {
    if (id === undefined) {
        console.error("Delete failed: ID is undefined");
        alert("Cannot delete: Software ID is missing.");
        return;
    }
    // Optional: Add confirmation dialog
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
        setSelectedSoftware(null); // Close modal if open
        // Optional: Show success message
        alert('Software deleted successfully.');

    } catch (err) {
        console.error("Failed to delete software:", err);
        // Display error to user
        alert('Failed to delete software: ' + (err instanceof Error ? err.message : String(err)));
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

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Header Section */}
      <div 
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0', transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        <h2 style={{
          fontSize: '1.25rem', fontWeight: '600', color: '#111827',
          display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0
        }}>
          <BookOpen size={18} /> {/* Icon for Software */} 
          Software Catalog {hasLoaded ? `(${softwareList.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new software"
          >
            <Plus size={16} />
          </button>
          <div style={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>
      
      {/* Expandable Table Section */}
      {isExpanded && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0 0 0.5rem 0.5rem', padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto', transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>Loading software...</p>
              <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Version</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Vendor</th>
                </tr>
              </thead>
              <tbody>
                {softwareList.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No software found</td></tr>
                ) : (
                  softwareList.map((sw) => (
                    <tr key={sw.softwareId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(sw)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{sw.softwareId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{sw.softwareName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{sw.majorVersion || '-'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{sw.vendor || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Software"
          fields={addEntryFields}
          onSave={handleSaveEntry} 
        />
      )}

      {/* Edit/Details Modal */}
      {selectedSoftware && (
        <EditableDetailsModal
          isOpen={selectedSoftware !== null}
          onClose={() => setSelectedSoftware(null)}
          title={`Software Details: ${selectedSoftware.softwareName}`}
          data={selectedSoftware} // Pass camelCase data
          fields={detailsFields}
          onSave={handleUpdateSoftware} 
          // Pass the delete handler to the modal if it supports a delete button
          onDelete={() => handleDeleteSoftware(selectedSoftware?.softwareId)} 
        />
      )}
    </div>
  );
} 