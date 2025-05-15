'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Activity, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HilOperation, TestBench } from '../../types/database';

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

// Define specific styles with explicit types
const styles: { [key: string]: CSSProperties } = {
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
    color: '#0F3460', // Example color, adjust if needed
    marginRight: '1rem'
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#0F3460', // Example color, adjust if needed
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
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    backgroundColor: '#39A2DB',
    color: 'white',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  loadingIcon: {
    animation: 'spin 1s linear infinite',
    marginBottom: '0.5rem',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableHeaderCell: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.875rem',
    fontWeight: 600, // Use number for fontWeight
    color: '#4b5563',
  },
  tableBodyRow: {
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tableBodyRowHover: { // For hover effect simulation if needed via JS
    backgroundColor: '#f9fafb',
  },
  tableBodyCell: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#1f2937',
  },
  noDataCell: {
    padding: '2rem',
    textAlign: 'center',
    color: '#6b7280',
  },
};

export default function HilOperationList() {
  const [hilOperations, setHilOperations] = useState<HilOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<HilOperation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  // Fetch related TestBench data for dropdowns
  const fetchRelatedData = async () => {
    try {
      const response = await fetch('/api/testbenches');
      if (response.ok) {
        const data = await response.json();
        setTestBenches(data.test_benches || []);
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
      const response = await fetch('/api/hiloperation');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL operations');
      }
      const data = await response.json();
      setHilOperations(data.operations || []);
    } catch (err) {
      setError('Error loading HIL operations: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL operations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to fetch data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main operations list
      await fetchRelatedData(); // Fetch related test benches
    };
    loadInitialData();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleRowClick = (op: HilOperation) => {
    setSelectedOperation(op);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/hiloperation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL operation');
      }

      const savedData = await response.json();
      const newOperation = savedData.operation as HilOperation;
      setHilOperations(prev => [...prev, newOperation]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save HIL operation:", err);
      throw err;
    }
  };

  const handleUpdateOperation = async (formData: Record<string, any>) => {
    try {
      if (!formData.operation_id) {
        throw new Error('HIL Operation ID (operation_id) is required');
      }

      const response = await fetch('/api/hiloperation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL operation');
      }

      const data = await response.json();
      const updatedOperation = data.operation as HilOperation;

      setHilOperations(prev =>
        prev.map(op =>
          op.operation_id === updatedOperation.operation_id ? updatedOperation : op
        )
      );
      setSelectedOperation(updatedOperation);

    } catch (err) {
      console.error("Failed to update HIL operation:", err);
      throw err;
    }
  };

  // Define fields using snake_case names
  const addEntryFields: ModalField[] = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
    },
    { name: 'possible_tests', label: 'Possible Tests', type: 'text' },
    { name: 'vehicle_datasets', label: 'Vehicle Datasets', type: 'text' },
    { name: 'scenarios', label: 'Scenarios', type: 'text' },
    { name: 'controldesk_projects', label: 'Controldesk Projects', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'operation_id', label: 'Operation ID', type: 'number', editable: false },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: testBenches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
    },
    { name: 'hil_name', label: 'HIL Name', type: 'text', editable: false },
    { name: 'possible_tests', label: 'Possible Tests', type: 'text', editable: true },
    { name: 'vehicle_datasets', label: 'Vehicle Datasets', type: 'text', editable: true },
    { name: 'scenarios', label: 'Scenarios', type: 'text', editable: true },
    { name: 'controldesk_projects', label: 'Controldesk Projects', type: 'text', editable: true },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Activity size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>
            HIL Operations {hilOperations.length > 0 ? `(${hilOperations.length})` : ''}
          </h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new HIL operation"
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add HIL Operation
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingIcon} />
            <p style={{ margin: 0 }}>Loading HIL operations...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <p>{error}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>Test Bench</th>
                <th style={styles.tableHeaderCell}>Possible Tests</th>
                <th style={styles.tableHeaderCell}>Vehicle Datasets</th>
                <th style={styles.tableHeaderCell}>Scenarios</th>
                <th style={styles.tableHeaderCell}>Controldesk Projects</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={styles.noDataCell}>
                    <div style={styles.loadingContainer}>
                      <RefreshCw size={24} style={styles.loadingIcon} />
                      <span>Loading HIL operations...</span>
                    </div>
                  </td>
                </tr>
              ) : hilOperations.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} style={styles.noDataCell}>No HIL operations found.</td>
                </tr>
              ) : (
                hilOperations.map((op) => (
                  <tr 
                    key={op.operation_id} 
                    onClick={() => handleRowClick(op)} 
                    style={styles.tableBodyRow}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.tableBodyCell}>{op.hil_name ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{op.possible_tests ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{op.vehicle_datasets ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{op.scenarios ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{op.controldesk_projects ?? 'N/A'}</td>
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
          title="Add New HIL Operation"
        />
      )}

      {selectedOperation && (
        <EditableDetailsModal
          isOpen={!!selectedOperation}
          onClose={() => setSelectedOperation(null)}
          data={selectedOperation}
          fields={detailsFields}
          onSave={handleUpdateOperation}
          title={`Edit HIL Operation (ID: ${selectedOperation.operation_id})`}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 