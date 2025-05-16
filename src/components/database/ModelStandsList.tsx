'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Archive, RefreshCw, PlusCircle, Ban } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { ModelStand } from '../../types/database';
import { usePermissions } from '@/contexts/PermissionContext';

// --- Reusable Modal Field Type Definitions ---
// (Consider moving to a shared file)
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function ModelStandsList() {
  const [modelStands, setModelStands] = useState<ModelStand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelStand, setSelectedModelStand] = useState<ModelStand | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { permissionName, isLoading: permissionsLoading } = usePermissions();
  const isReadOnly = permissionName === 'Read';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/modelstands');
      if (!response.ok) {
        throw new Error('Failed to fetch model stands');
      }
      const data = await response.json();
      setModelStands(data.model_stands || []);
    } catch (err) {
      setError('Error loading model stands: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching model stands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClick = () => {
    if (isReadOnly || permissionsLoading) return;
    setIsAddModalOpen(true);
  };

  const handleRowClick = (model: ModelStand) => {
    setSelectedModelStand(model);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/modelstands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add model stand');
      }

      const savedData = await response.json();
      const newModelStand = savedData.model_stand as ModelStand;
      setModelStands(prev => [...prev, newModelStand]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save model stand:", err);
      throw err;
    }
  };

  const handleUpdateModelStand = async (formData: Record<string, any>) => {
    try {
      if (!formData.model_id) {
        throw new Error('Model ID (model_id) is required');
      }

      const response = await fetch('/api/modelstands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update model stand');
      }

      const data = await response.json();
      const updatedModelStand = data.model_stand as ModelStand;

      setModelStands(prev =>
        prev.map(model =>
          model.model_id === updatedModelStand.model_id ? updatedModelStand : model
        )
      );
      if (selectedModelStand?.model_id === updatedModelStand.model_id) {
         setSelectedModelStand(updatedModelStand);
      }

    } catch (err) {
      console.error("Failed to update model stand:", err);
      throw err;
    }
  };

  // Define fields using snake_case names
  const addEntryFields: ModalField[] = [
    { name: 'model_name', label: 'Model Name', type: 'text', required: true },
    { name: 'svn_link', label: 'SVN Link', type: 'text' },
    { name: 'features', label: 'Features', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'model_id', label: 'Model ID', type: 'number', editable: false },
    { name: 'model_name', label: 'Model Name', type: 'text', required: true, editable: true },
    { name: 'svn_link', label: 'SVN Link', type: 'text', editable: true },
    { name: 'features', label: 'Features', type: 'text', editable: true },
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
          <Archive size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Model Stands {modelStands.length > 0 ? `(${modelStands.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            ...( (isReadOnly || permissionsLoading) ? { cursor: 'not-allowed', opacity: 0.7 } : {}),
          }}
          disabled={isReadOnly || permissionsLoading}
          title={isReadOnly ? "Read-only: Cannot add new model stand" : "Add new model stand"}
        >
          {(isReadOnly && !permissionsLoading) && <Ban size={16} style={{ marginRight: '0.5rem' }} />}
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add Model Stand
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading model stands...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>Model Name</th>
                <th style={styles.tableHeaderCell}>Associated HIL(s)</th>
                <th style={styles.tableHeaderCell}>SVN Link</th>
                <th style={styles.tableHeaderCell}>Features</th>
              </tr>
            </thead>
            <tbody>
              {modelStands.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No model stands found</td></tr>
              ) : (
                modelStands.map((model) => (
                  <tr key={model.model_id}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(model)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{model.model_name}</td>
                    <td style={styles.tableBodyCell}>{model.associated_hil_names || 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{model.svn_link || '-'}</td>
                    <td style={styles.tableBodyCell}>{model.features || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selectedModelStand && (
        <EditableDetailsModal
          isOpen={selectedModelStand !== null}
          onClose={() => setSelectedModelStand(null)}
          title={`Model Stand Details: ${selectedModelStand.model_name}`}
          data={selectedModelStand}
          fields={detailsFields}
          onSave={handleUpdateModelStand}
          isReadOnly={isReadOnly}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Model Stand"
          fields={addEntryFields}
          onSave={handleSaveEntry}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
} 