'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { TestTube, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { Wetbench, TestBench } from '../../types/database';
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

export default function WetbenchesList() {
  const [wetbenches, setWetbenches] = useState<Wetbench[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWetbench, setSelectedWetbench] = useState<Wetbench | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  // Fetch related TestBench data for dropdowns
  const fetchRelatedData = async () => {
    if (testBenches.length > 0) return;
    try {
      const response = await fetch('/api/testbenches');
      if (response.ok) {
        const data = await response.json();
        setTestBenches(keysToCamel<TestBench[]>(data.testBenches || []));
      } else {
          console.error('Failed to fetch test benches for dropdown');
          setTestBenches([]);
      }
    } catch (err) {
      console.error('Error fetching test benches for dropdown:', err);
      setTestBenches([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wetbenches');
      if (!response.ok) {
        throw new Error('Failed to fetch wetbenches');
      }
      const data = await response.json();
      setWetbenches(keysToCamel<Wetbench[]>(data.wetbenches || []));
    } catch (err) {
      setError('Error loading wetbenches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching wetbenches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main wetbenches list
      await fetchRelatedData(); // Fetch related test benches
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleRowClick = (wetbench: Wetbench) => {
      setSelectedWetbench(wetbench);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/wetbenches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add wetbench');
      }

      const savedData = await response.json();
      const newWetbench = keysToCamel<Wetbench>(savedData.wetbench);
      setWetbenches(prev => [...prev, newWetbench]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save wetbench:", err);
      throw err;
    }
  };

  const handleUpdateWetbench = async (formData: Record<string, any>) => {
    try {
      if (!formData.wetbenchId) {
        throw new Error('Wetbench ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/wetbenches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wetbench');
      }

      const data = await response.json();
      const updatedWetbench = keysToCamel<Wetbench>(data.wetbench);

      setWetbenches(prev =>
        prev.map(wb =>
          wb.wetbenchId === updatedWetbench.wetbenchId ? updatedWetbench : wb
        )
      );
      if (selectedWetbench?.wetbenchId === updatedWetbench.wetbenchId) {
           setSelectedWetbench(updatedWetbench);
      }

    } catch (err) {
      console.error("Failed to update wetbench:", err);
      throw err;
    }
  };

  // Define fields using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'wetbenchName', label: 'Wetbench Name', type: 'text', required: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text' },
    { name: 'owner', label: 'Owner', type: 'text' },
    { name: 'systemType', label: 'System Type', type: 'text' },
    { name: 'platform', label: 'Platform', type: 'text' },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text' },
    {
      name: 'linkedBenchId', 
      label: 'Linked Test Bench', 
      type: 'select',
      options: [
          { value: '', label: 'None' },
          ...testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
      ]
    },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text' },
    { name: 'hardwareComponents', label: 'Hardware Components', type: 'text' },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'wetbenchId', label: 'Wetbench ID', type: 'number', editable: false },
    { name: 'wetbenchName', label: 'Wetbench Name', type: 'text', required: true, editable: true },
    { name: 'ppNumber', label: 'PP Number', type: 'text', editable: true },
    { name: 'owner', label: 'Owner', type: 'text', editable: true },
    { name: 'systemType', label: 'System Type', type: 'text', editable: true },
    { name: 'platform', label: 'Platform', type: 'text', editable: true },
    { name: 'systemSupplier', label: 'System Supplier', type: 'text', editable: true },
    {
      name: 'linkedBenchId',
      label: 'Linked Test Bench',
      type: 'select',
      required: false,
      editable: true,
      options: [
        { value: '', label: 'None' },
        ...testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
      ]
    },
    { name: 'actuatorInfo', label: 'Actuator Info', type: 'text', editable: true },
    { name: 'hardwareComponents', label: 'Hardware Components', type: 'text', editable: true },
    { name: 'inventoryNumber', label: 'Inventory Number', type: 'text', editable: true },
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
          <TestTube size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Wetbenches {wetbenches.length > 0 ? `(${wetbenches.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new wetbench"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add Wetbench
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading wetbenches...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                {/* Adjust headers as needed */}
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>PP Number</th>
                <th style={styles.tableHeaderCell}>Owner</th>
                <th style={styles.tableHeaderCell}>System Type</th>
                <th style={styles.tableHeaderCell}>Platform</th>
                <th style={styles.tableHeaderCell}>Inventory Nr.</th>
                <th style={styles.tableHeaderCell}>Linked Bench</th>
              </tr>
            </thead>
            <tbody>
              {wetbenches.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No wetbenches found</td></tr>
              ) : (
                wetbenches.map((wetbench) => {
                    const linkedBenchName = (testBenches.length === 0 && loading) ? 'Loading...' : (testBenches.find(tb => tb.benchId === wetbench.linkedBenchId)?.hilName || 'N/A');
                    return (
                      <tr key={wetbench.wetbenchId}
                        style={styles.tableBodyRow}
                        onClick={() => handleRowClick(wetbench)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={styles.tableBodyCell}>{wetbench.wetbenchId}</td>
                        <td style={styles.tableBodyCell}>{wetbench.wetbenchName}</td>
                        <td style={styles.tableBodyCell}>{wetbench.ppNumber || '-'}</td>
                        <td style={styles.tableBodyCell}>{wetbench.owner || '-'}</td>
                        <td style={styles.tableBodyCell}>{wetbench.systemType || '-'}</td>
                        <td style={styles.tableBodyCell}>{wetbench.platform || '-'}</td>
                        <td style={styles.tableBodyCell}>{wetbench.inventoryNumber || '-'}</td>
                        <td style={styles.tableBodyCell}>{linkedBenchName}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {selectedWetbench && (
        <EditableDetailsModal
          isOpen={selectedWetbench !== null}
          onClose={() => setSelectedWetbench(null)}
          title={`Wetbench Details: ${selectedWetbench.wetbenchName}`}
          data={selectedWetbench}
          fields={detailsFields}
          onSave={handleUpdateWetbench}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Wetbench"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 