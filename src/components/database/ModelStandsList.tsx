'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Archive, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { ModelStand } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/modelstands');
      if (!response.ok) {
        throw new Error('Failed to fetch model stands');
      }
      const data = await response.json();
      setModelStands(keysToCamel<ModelStand[]>(data.modelStands || []));
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
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/modelstands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add model stand');
      }

      const savedData = await response.json();
      const newModelStand = keysToCamel<ModelStand>(savedData.modelStand);
      setModelStands(prev => [...prev, newModelStand]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save model stand:", err);
      throw err;
    }
  };

  const handleUpdateModelStand = async (formData: Record<string, any>) => {
    try {
      if (!formData.modelId) {
        throw new Error('Model ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/modelstands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update model stand');
      }

      const data = await response.json();
      const updatedModelStand = keysToCamel<ModelStand>(data.modelStand);

      setModelStands(prev =>
        prev.map(model =>
          model.modelId === updatedModelStand.modelId ? updatedModelStand : model
        )
      );
      if (selectedModelStand?.modelId === updatedModelStand.modelId) {
         setSelectedModelStand(updatedModelStand);
      }

    } catch (err) {
      console.error("Failed to update model stand:", err);
      throw err;
    }
  };

  // Define fields using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'modelName', label: 'Model Name', type: 'text', required: true },
    { name: 'svnLink', label: 'SVN Link', type: 'text' },
    { name: 'features', label: 'Features', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'modelId', label: 'Model ID', type: 'number', editable: false },
    { name: 'modelName', label: 'Model Name', type: 'text', required: true, editable: true },
    { name: 'svnLink', label: 'SVN Link', type: 'text', editable: true },
    { name: 'features', label: 'Features', type: 'text', editable: true },
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
          <Archive size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Model Stands {modelStands.length > 0 ? `(${modelStands.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new model stand"
        >
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
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>Model Name</th>
                <th style={styles.tableHeaderCell}>SVN Link</th>
                <th style={styles.tableHeaderCell}>Features</th>
              </tr>
            </thead>
            <tbody>
              {modelStands.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No model stands found</td></tr>
              ) : (
                modelStands.map((model) => (
                  <tr key={model.modelId}
                    style={styles.tableBodyRow}
                    onClick={() => setSelectedModelStand(model)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{model.modelId}</td>
                    <td style={styles.tableBodyCell}>{model.modelName}</td>
                    <td style={styles.tableBodyCell}>{model.svnLink || '-'}</td>
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
          title={`Model Stand Details: ${selectedModelStand.modelName}`}
          data={selectedModelStand}
          fields={detailsFields}
          onSave={handleUpdateModelStand}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Model Stand"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 