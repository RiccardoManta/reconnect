'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { CircuitBoard, RefreshCw, PlusCircle, Ban } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HilTechnology, TestBench } from '../../types/database';
import { usePermissions } from '@/contexts/PermissionContext';

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
  const [hil_technology, setHilTechnology] = useState<HilTechnology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected_technology, setSelectedTechnology] = useState<HilTechnology | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [test_benches, setTestBenches] = useState<TestBench[]>([]); // State for related TestBenches

  const { permissionName, isLoading: permissionsLoading } = usePermissions();
  const isReadOnly = permissionName === 'Read';

  // Fetch related TestBench data for dropdowns
  const fetchRelatedData = async () => {
    if (test_benches.length > 0) return;
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
      const response = await fetch('/api/hiltechnology');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL technology');
      }
      const data = await response.json();
      setHilTechnology(data.technology || []);
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
    if (isReadOnly || permissionsLoading) return;
    // fetchRelatedData(); // No longer needed here
    setIsAddModalOpen(true);
  };

  const handleRowClick = (tech: HilTechnology) => {
    // fetchRelatedData(); // No longer needed here
    setSelectedTechnology(tech);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/hiltechnology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL technology');
      }

      const savedData = await response.json();
      const new_technology = savedData.technology as HilTechnology; // API returns snake_case
      setHilTechnology(prev => [...prev, new_technology]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save HIL technology:", err);
      throw err;
    }
  };

  const handleUpdateTechnology = async (formData: Record<string, any>) => {
    try {
      if (!formData.tech_id) {
        throw new Error('Technology ID (tech_id) is required');
      }

      const response = await fetch('/api/hiltechnology', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL technology');
      }

      const data = await response.json();
      const updated_technology = data.technology as HilTechnology; // API returns snake_case

      setHilTechnology(prev =>
        prev.map(tech =>
          tech.tech_id === updated_technology.tech_id ? updated_technology : tech
        )
      );
      if (selected_technology?.tech_id === updated_technology.tech_id) {
           setSelectedTechnology(updated_technology);
      }

    } catch (err) {
      console.error("Failed to update HIL technology:", err);
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
      options: [
          { value: '', label: 'Select a Bench' },
          ...test_benches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
      ]
    },
    { name: 'fiu_info', label: 'FIU Info', type: 'text' },
    { name: 'io_info', label: 'I/O Info', type: 'text' },
    { name: 'can_interface', label: 'CAN Interface', type: 'text' },
    { name: 'power_interface', label: 'Power Interface', type: 'text' },
    { name: 'possible_tests', label: 'Possible Tests', type: 'text' },
    { name: 'leakage_module', label: 'Leakage Module', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'tech_id', label: 'Technology ID', type: 'number', editable: false },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: [
        { value: '', label: 'Select a Bench' },
        ...test_benches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
      ]
    },
    { name: 'hil_name', label: 'HIL Name', type: 'text', editable: false }, // Display only if tech object has hil_name
    { name: 'fiu_info', label: 'FIU Info', type: 'text', editable: true },
    { name: 'io_info', label: 'I/O Info', type: 'text', editable: true },
    { name: 'can_interface', label: 'CAN Interface', type: 'text', editable: true },
    { name: 'power_interface', label: 'Power Interface', type: 'text', editable: true },
    { name: 'possible_tests', label: 'Possible Tests', type: 'text', editable: true },
    { name: 'leakage_module', label: 'Leakage Module', type: 'text', editable: true },
    { name: 'created_at', label: 'Created At', type: 'text', editable: false }, // Assuming these exist on HilTechnology
    { name: 'updated_at', label: 'Updated At', type: 'text', editable: false }, // Assuming these exist on HilTechnology
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
    noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <CircuitBoard size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>
            HIL Technology {hil_technology.length > 0 ? `(${hil_technology.length})` : ''}
          </h1>
        </div>
        <button
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            ...( (isReadOnly || permissionsLoading) ? { cursor: 'not-allowed', opacity: 0.7 } : {}),
          }}
          disabled={isReadOnly || permissionsLoading}
          title={isReadOnly ? "Read-only: Cannot add new technology" : "Add new HIL technology"}
        >
          {(isReadOnly && !permissionsLoading) && <Ban size={16} style={{ marginRight: '0.5rem' }} />}
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
                <th style={styles.tableHeaderCell}>Test Bench</th>
                <th style={styles.tableHeaderCell}>Technology Name</th>
                <th style={styles.tableHeaderCell}>FIU Info</th>
                <th style={styles.tableHeaderCell}>I/O Info</th>
                <th style={styles.tableHeaderCell}>CAN Interface</th>
                <th style={styles.tableHeaderCell}>Power Interface</th>
                <th style={styles.tableHeaderCell}>Leakage Module</th>
              </tr>
            </thead>
            <tbody>
              {hil_technology.length === 0 ? (
                <tr><td colSpan={7} style={styles.noDataCell}>No HIL technology entries found.</td></tr>
              ) : (
                hil_technology.map((tech) => {
                  return (
                    <tr
                      key={tech.tech_id}
                      style={styles.tableBodyRow}
                      onClick={() => handleRowClick(tech)}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={styles.tableBodyCell}>{tech.hil_name ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{tech.possible_tests ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{tech.fiu_info ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{tech.io_info ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{tech.can_interface ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{tech.power_interface ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{tech.leakage_module ?? 'N/A'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selected_technology && (
        <EditableDetailsModal
          isOpen={!!selected_technology}
          onClose={() => { setSelectedTechnology(null); setError(null); }}
          data={selected_technology}
          fields={detailsFields}
          onSave={handleUpdateTechnology}
          title={`Edit HIL Technology: ${selected_technology.hil_name || 'N/A'}`}
          isReadOnly={isReadOnly}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New HIL Technology"
          fields={addEntryFields}
          onSave={handleSaveEntry}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
} 