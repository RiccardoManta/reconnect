'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { CircuitBoard, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HilTechnology, TestBench } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';

// --- Reusable Modal Field Type Definitions ---
// ... (ModalField types definition) ...
type FieldType = 'text' | 'number' | 'date' | 'select';
interface SelectOption { value: string; label: string; }
interface BaseField { name: string; label: string; required?: boolean; editable?: boolean; }
interface TextField extends BaseField { type: 'text'; }
interface NumberField extends BaseField { type: 'number'; }
interface DateField extends BaseField { type: 'date'; }
interface SelectField extends BaseField { type: 'select'; options: SelectOption[]; }
type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function HilTechnologyList() {
  const [hilTechnology, setHilTechnology] = useState<HilTechnology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<HilTechnology | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]); // State for related TestBenches

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
      const response = await fetch('/api/hiltechnology');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL technology');
      }
      const data = await response.json();
      setHilTechnology(keysToCamel<HilTechnology[]>(data.technology || []));
    } catch (err) {
      setError('Error loading HIL technology: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL technology:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main technology list
      await fetchRelatedData(); // Fetch related test benches
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    // fetchRelatedData(); // No longer needed here
    setIsAddModalOpen(true);
  };

  const handleRowClick = (tech: HilTechnology) => {
      // fetchRelatedData(); // No longer needed here
      setSelectedTechnology(tech);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hiltechnology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL technology');
      }

      const savedData = await response.json();
      const newTechnology = keysToCamel<HilTechnology>(savedData.technology);
      setHilTechnology(prev => [...prev, newTechnology]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save HIL technology:", err);
      throw err;
    }
  };

  const handleUpdateTechnology = async (formData: Record<string, any>) => {
    try {
      if (!formData.techId) {
        throw new Error('Technology ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hiltechnology', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL technology');
      }

      const data = await response.json();
      const updatedTechnology = keysToCamel<HilTechnology>(data.technology);

      setHilTechnology(prev =>
        prev.map(tech =>
          tech.techId === updatedTechnology.techId ? updatedTechnology : tech
        )
      );
      if (selectedTechnology?.techId === updatedTechnology.techId) {
           setSelectedTechnology(updatedTechnology);
      }

    } catch (err) {
      console.error("Failed to update HIL technology:", err);
      throw err;
    }
  };

  // Define fields using camelCase names
  const addEntryFields: ModalField[] = [
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: [
          { value: '', label: 'Select a Bench' },
          ...testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
      ]
    },
    { name: 'fiuInfo', label: 'FIU Info', type: 'text' },
    { name: 'ioInfo', label: 'I/O Info', type: 'text' },
    { name: 'canInterface', label: 'CAN Interface', type: 'text' },
    { name: 'powerInterface', label: 'Power Interface', type: 'text' },
    { name: 'possibleTests', label: 'Possible Tests', type: 'text' },
    { name: 'leakageModule', label: 'Leakage Module', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'techId', label: 'Technology ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: [
        { value: '', label: 'Select a Bench' },
        ...testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
      ]
    },
    { name: 'fiuInfo', label: 'FIU Info', type: 'text', editable: true },
    { name: 'ioInfo', label: 'I/O Info', type: 'text', editable: true },
    { name: 'canInterface', label: 'CAN Interface', type: 'text', editable: true },
    { name: 'powerInterface', label: 'Power Interface', type: 'text', editable: true },
    { name: 'possibleTests', label: 'Possible Tests', type: 'text', editable: true },
    { name: 'leakageModule', label: 'Leakage Module', type: 'text', editable: true },
  ];

  // Helper to get bench name (consider memoization)
  const getBenchName = (id: number | undefined): string => {
      if (id === undefined) return 'N/A';
      // Add loading check
      if (testBenches.length === 0 && loading) return 'Loading...'; 
      return testBenches.find(b => b.benchId === id)?.hilName || 'Unknown';
  }

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
          <CircuitBoard size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>HIL Technology {hilTechnology.length > 0 ? `(${hilTechnology.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new HIL technology"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add Technology
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading HIL technology...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>Tech ID</th>
                <th style={styles.tableHeaderCell}>HIL Name</th>
                <th style={styles.tableHeaderCell}>FIU Info</th>
                <th style={styles.tableHeaderCell}>I/O Info</th>
                <th style={styles.tableHeaderCell}>CAN Interface</th>
                <th style={styles.tableHeaderCell}>Power Interface</th>
                <th style={styles.tableHeaderCell}>Leakage Module</th>
              </tr>
            </thead>
            <tbody>
              {hilTechnology.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL technology found</td></tr>
              ) : (
                hilTechnology.map((tech) => (
                  <tr key={tech.techId}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(tech)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{tech.techId}</td>
                    <td style={styles.tableBodyCell}>{getBenchName(tech.benchId)}</td> 
                    <td style={styles.tableBodyCell}>{tech.fiuInfo || '-'}</td>
                    <td style={styles.tableBodyCell}>{tech.ioInfo || '-'}</td>
                    <td style={styles.tableBodyCell}>{tech.canInterface || '-'}</td>
                    <td style={styles.tableBodyCell}>{tech.powerInterface || '-'}</td>
                    <td style={styles.tableBodyCell}>{tech.leakageModule || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selectedTechnology && (
        <EditableDetailsModal
          isOpen={selectedTechnology !== null}
          onClose={() => setSelectedTechnology(null)}
          title={`HIL Technology Details (Bench: ${getBenchName(selectedTechnology.benchId)})`}
          data={selectedTechnology}
          fields={detailsFields}
          onSave={handleUpdateTechnology}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New HIL Technology"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 