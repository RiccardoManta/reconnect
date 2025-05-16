'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { TestTube, RefreshCw, PlusCircle, Ban } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { Wetbench, TestBench } from '../../types/database';
import { usePermissions } from '@/contexts/PermissionContext';

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
  const [selected_wetbench, setSelectedWetbench] = useState<Wetbench | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [test_benches, setTestBenches] = useState<TestBench[]>([]);

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
      const response = await fetch('/api/wetbenches');
      if (!response.ok) {
        throw new Error('Failed to fetch wetbenches');
      }
      const data = await response.json();
      setWetbenches(data.wetbenches || []);
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
    if (isReadOnly || permissionsLoading) return;
    setIsAddModalOpen(true);
  };

  const handleRowClick = (wetbench: Wetbench) => {
    setSelectedWetbench(wetbench);
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/wetbenches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add wetbench');
      }

      const savedData = await response.json();
      const new_wetbench = savedData.wetbench as Wetbench;
      setWetbenches(prev => [...prev, new_wetbench].sort((a,b) => a.wetbench_id - b.wetbench_id));
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save wetbench:", err);
      throw err;
    }
  };

  const handleUpdateWetbench = async (formData: Record<string, any>) => {
    try {
      if (!formData.wetbench_id) {
        throw new Error('Wetbench ID (wetbench_id) is required');
      }

      const response = await fetch('/api/wetbenches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wetbench');
      }

      const data = await response.json();
      const updated_wetbench = data.wetbench as Wetbench;

      setWetbenches(prev =>
        prev.map(wb =>
          wb.wetbench_id === updated_wetbench.wetbench_id ? updated_wetbench : wb
        ).sort((a,b) => a.wetbench_id - b.wetbench_id)
      );
      if (selected_wetbench?.wetbench_id === updated_wetbench.wetbench_id) {
           setSelectedWetbench(updated_wetbench);
      }

    } catch (err) {
      console.error("Failed to update wetbench:", err);
      throw err;
    }
  };

  // Define fields using snake_case names
  const addEntryFields: ModalField[] = [
    { name: 'wetbench_name', label: 'Wetbench Name', type: 'text', required: true },
    { name: 'pp_number', label: 'PP Number', type: 'text' },
    { name: 'owner', label: 'Owner', type: 'text' },
    { name: 'system_type', label: 'System Type', type: 'text' },
    { name: 'system_supplier', label: 'System Supplier', type: 'text' },
    {
      name: 'linked_bench_id', 
      label: 'Linked Test Bench', 
      type: 'select',
      options: [
          { value: '', label: 'None' },
          ...test_benches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
      ]
    },
    { name: 'actuator_info', label: 'Actuator Info', type: 'text' },
    { name: 'hardware_components', label: 'Hardware Components', type: 'text' },
    { name: 'inventory_number', label: 'Inventory Number', type: 'text' },
  ];

  const detailsFields: ModalField[] = [
    { name: 'wetbench_id', label: 'Wetbench ID', type: 'number', editable: false },
    { name: 'wetbench_name', label: 'Wetbench Name', type: 'text', required: true, editable: true },
    { name: 'pp_number', label: 'PP Number', type: 'text', editable: true },
    { name: 'owner', label: 'Owner', type: 'text', editable: true },
    { name: 'system_type', label: 'System Type', type: 'text', editable: true },
    { name: 'system_supplier', label: 'System Supplier', type: 'text', editable: true },
    {
      name: 'linked_bench_id',
      label: 'Linked Test Bench',
      type: 'select',
      required: false,
      editable: true,
      options: [
        { value: '', label: 'None' },
        ...test_benches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
      ]
    },
    { name: 'actuator_info', label: 'Actuator Info', type: 'text', editable: true },
    { name: 'hardware_components', label: 'Hardware Components', type: 'text', editable: true },
    { name: 'inventory_number', label: 'Inventory Number', type: 'text', editable: true },
    { name: 'linked_bench_name', label: 'Linked Bench Name', type: 'text', editable: false },
    { name: 'created_at', label: 'Created At', type: 'text', editable: false },
    { name: 'updated_at', label: 'Updated At', type: 'text', editable: false },
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
          <TestTube size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Wetbenches {wetbenches.length > 0 ? `(${wetbenches.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={{
            ...styles.addButton,
            ...( (isReadOnly || permissionsLoading) ? { cursor: 'not-allowed', opacity: 0.7 } : {}),
          }}
          disabled={isReadOnly || permissionsLoading}
          title={isReadOnly ? "Read-only: Cannot add new wetbench" : "Add new wetbench"}
        >
          {(isReadOnly && !permissionsLoading) && <Ban size={16} style={{ marginRight: '0.5rem' }} />}
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
                <th style={styles.tableHeaderCell}>Wetbench Name</th>
                <th style={styles.tableHeaderCell}>Linked Test Bench</th>
                <th style={styles.tableHeaderCell}>System Type</th>
                <th style={styles.tableHeaderCell}>System Supplier</th>
                <th style={styles.tableHeaderCell}>Owner</th>
                <th style={styles.tableHeaderCell}>Inventory No.</th>
                <th style={styles.tableHeaderCell}>PP Number</th>
                <th style={styles.tableHeaderCell}>Actuator Info</th>
              </tr>
            </thead>
            <tbody>
              {wetbenches.length === 0 ? (
                <tr><td colSpan={8} style={styles.noDataCell}>No wetbenches found.</td></tr>
              ) : (
                wetbenches.map((wb) => {
                  return (
                    <tr 
                      key={wb.wetbench_id} 
                      style={styles.tableBodyRow} 
                      onClick={() => handleRowClick(wb)}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={styles.tableBodyCell}>{wb.wetbench_name ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.hil_name ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.system_type ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.system_supplier ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.owner ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.inventory_number ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.pp_number ?? 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{wb.actuator_info ?? 'N/A'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {selected_wetbench && (
        <EditableDetailsModal
          isOpen={!!selected_wetbench}
          onClose={() => { setSelectedWetbench(null); setError(null); }}
          data={selected_wetbench}
          fields={detailsFields}
          onSave={handleUpdateWetbench}
          title={`Edit Wetbench (ID: ${selected_wetbench.wetbench_id})`}
          isReadOnly={isReadOnly}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Wetbench"
          fields={addEntryFields}
          onSave={handleSaveEntry}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
} 