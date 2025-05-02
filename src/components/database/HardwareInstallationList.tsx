'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Wrench as Tool, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HardwareInstallation, TestBench } from '../../types/database';
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
  loadingIcon: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
  errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
  tableBodyRow: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' },
  tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
};

export default function HardwareInstallationList() {
  const [hardwareInstallations, setHardwareInstallations] = useState<HardwareInstallation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHardware, setSelectedHardware] = useState<HardwareInstallation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  // Fetch related TestBench data for dropdowns
  const fetchRelatedData = async () => {
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
      const response = await fetch('/api/hardware');
      if (!response.ok) {
        throw new Error('Failed to fetch hardware installations');
      }
      const data = await response.json();
      setHardwareInstallations(keysToCamel<HardwareInstallation[]>(data.hardware || []));
    } catch (err) {
      setError('Error loading hardware installations: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching hardware installations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main hardware list
      await fetchRelatedData(); // Fetch related test benches
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleRowClick = (hw: HardwareInstallation) => {
    setSelectedHardware(hw);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add hardware installation');
      }

      const savedData = await response.json();
      const newHardware = keysToCamel<HardwareInstallation>(savedData.hardware);
      setHardwareInstallations(prev => [...prev, newHardware]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save hardware installation:", err);
      throw err;
    }
  };

  const handleUpdateHardware = async (formData: Record<string, any>) => {
    try {
      if (!formData.installId) {
        throw new Error('Hardware ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/hardware', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hardware installation');
      }

      const data = await response.json();
      const updatedHardware = keysToCamel<HardwareInstallation>(data.hardware);

      setHardwareInstallations(prev =>
        prev.map(hw =>
          hw.installId === updatedHardware.installId ? updatedHardware : hw
        )
      );
      setSelectedHardware(updatedHardware);

    } catch (err) {
      console.error("Failed to update hardware installation:", err);
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
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'ecuInfo', label: 'ECU Info', type: 'text' },
    { name: 'sensors', label: 'Sensors', type: 'text' },
    { name: 'additionalPeriphery', label: 'Additional Periphery', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'installId', label: 'Install ID', type: 'number', editable: false },
    {
      name: 'benchId',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: testBenches.map(tb => ({ value: String(tb.benchId), label: tb.hilName }))
    },
    { name: 'ecuInfo', label: 'ECU Info', type: 'text', editable: true },
    { name: 'sensors', label: 'Sensors', type: 'text', editable: true },
    { name: 'additionalPeriphery', label: 'Additional Periphery', type: 'text', editable: true },
  ];

  // Helper function to get bench name
  const getBenchName = (id: number): string => {
    if (testBenches.length === 0 && loading) return 'Loading...'; 
    return testBenches.find(tb => tb.benchId === id)?.hilName || 'N/A';
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Tool size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>
            Hardware Installation {hardwareInstallations.length > 0 ? `(${hardwareInstallations.length})` : ''}
          </h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new hardware installation"
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Hardware
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingIcon} />
            <p style={{ margin: 0 }}>Loading hardware installations...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <p>{error}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>HIL Name</th>
                <th style={styles.tableHeaderCell}>ECU Info</th>
                <th style={styles.tableHeaderCell}>Sensors</th>
                <th style={styles.tableHeaderCell}>Additional Periphery</th>
              </tr>
            </thead>
            <tbody>
              {hardwareInstallations.length === 0 ? (
                <tr><td colSpan={5} style={styles.noDataCell}>No hardware installations found</td></tr>
              ) : (
                hardwareInstallations.map((hw) => (
                  <tr key={hw.installId}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(hw)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{hw.installId}</td>
                    <td style={styles.tableBodyCell}>{getBenchName(hw.benchId)}</td>
                    <td style={styles.tableBodyCell}>{hw.ecuInfo || '-'}</td>
                    <td style={styles.tableBodyCell}>{hw.sensors || '-'}</td>
                    <td style={styles.tableBodyCell}>{hw.additionalPeriphery || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveEntry}
          fields={addEntryFields}
          title="Add New Hardware Installation"
        />
      )}

      {selectedHardware && (
        <EditableDetailsModal
          isOpen={!!selectedHardware}
          onClose={() => setSelectedHardware(null)}
          onSave={handleUpdateHardware}
          fields={detailsFields}
          data={selectedHardware}
          title={`Edit Hardware Installation (Bench: ${getBenchName(selectedHardware.benchId)})`}
        />
      )}

      {/* Keep spin animation style if needed globally or move it */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 