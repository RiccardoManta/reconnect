'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Wrench as Tool, RefreshCw, Plus, Ban } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { HardwareInstallation, TestBench, HardwareGroupType } from '../../types/database';
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
  const [hardwareGroupTypes, setHardwareGroupTypes] = useState<HardwareGroupType[]>([]);

  const { permissionName, isLoading: permissionsLoading } = usePermissions();
  const isReadOnly = permissionName === 'Read';

  const fetchRelatedData = async () => {
    try {
      const tbResponse = await fetch('/api/testbenches');
      if (tbResponse.ok) {
        const tbData = await tbResponse.json();
        setTestBenches(tbData.test_benches || []);
      } else {
        console.error('Failed to fetch test benches for dropdown');
        setTestBenches([]);
      }

      const hgtResponse = await fetch('/api/hardwaregrouptypes');
      if (hgtResponse.ok) {
        const hgtData = await hgtResponse.json();
        setHardwareGroupTypes(hgtData.hardware_group_types || []);
      } else {
        console.error('Failed to fetch hardware group types for dropdown');
        setHardwareGroupTypes([]);
      }
    } catch (err) {
      console.error('Error fetching related data for dropdowns:', err);
      setTestBenches([]);
      setHardwareGroupTypes([]);
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
      setHardwareInstallations(data.hardware_installations || []);
    } catch (err) {
      setError('Error loading hardware installations: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching hardware installations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchRelatedData();
      await fetchData();
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    if (isReadOnly || permissionsLoading) return;
    setIsAddModalOpen(true);
  };

  const handleRowClick = (hw: HardwareInstallation) => {
    setSelectedHardware(hw);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    // Assuming formData from AddEntryModal already uses snake_case field names
    try {
      const response = await fetch('/api/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData), // Send formData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add hardware installation');
      }

      const savedData = await response.json();
      const newHardware = savedData.hardware_installation as HardwareInstallation;
      setHardwareInstallations(prev => [...prev, newHardware].sort((a,b) => a.install_id - b.install_id));
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save hardware installation:", err);
      throw err; // Re-throw for AddEntryModal to handle
    }
  };

  const handleUpdateHardware = async (formData: Record<string, any>) => {
    // Assuming formData from EditableDetailsModal already uses snake_case field names
    console.log('handleUpdateHardware called with formData:', JSON.stringify(formData, null, 2));
    setError(null);
    try {
      const install_id = formData.install_id; // Expecting snake_case
      if (!install_id) {
        throw new Error('Hardware ID (install_id) is required for update');
      }

      const processedFormData = { ...formData };
      // Ensure numeric fields are numbers
      if (processedFormData.bench_id !== undefined && processedFormData.bench_id !== null && String(processedFormData.bench_id).trim() !== '') {
        processedFormData.bench_id = Number(processedFormData.bench_id);
        if (isNaN(processedFormData.bench_id)) {
          throw new Error('Invalid Bench ID provided.');
        }
      } else if (String(processedFormData.bench_id).trim() === '' || processedFormData.bench_id === null) {
         // bench_id is NOT NULL. If it's empty or null, it's an error. Consider making select required.
         // For now, if it's empty string or explicitly null, and required, this is an issue.
         // If the modal ensures a value or API handles bad ID, this might be okay.
         // If it must be provided, remove it or set to an invalid marker if API expects all fields.
         // For now, if it's empty, it will become 0 or NaN which API should reject.
         // This path implies it might be intentionally set to null/empty - ensure this is valid or handled.
      }

      if (processedFormData.hardware_group_id !== undefined && processedFormData.hardware_group_id !== null && String(processedFormData.hardware_group_id).trim() !== '') {
        processedFormData.hardware_group_id = Number(processedFormData.hardware_group_id);
         if (isNaN(processedFormData.hardware_group_id)) {
          throw new Error('Invalid Hardware Group ID provided.');
        }
      }
      
      // Remove derived fields not part of the update payload or API ignores them
      delete processedFormData.hil_name; 
      delete processedFormData.group_name;
      // install_id is in the URL, but if it's in formData and not expected in body, remove it.
      // However, our API expects all fields in snake_case as per HardwareInstallationUpdateBody.
      // For the PUT request, we only send changed fields or all fields the API expects for an update.
      // The current API in [id]/route.ts expects only fields that are part of HardwareInstallationUpdateBody.
      // So, we should construct the body carefully. Let's assume processedFormData only contains valid update fields.

      const response = await fetch(`/api/hardware/${install_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedFormData), // Send processedFormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to update hardware installation';
        setError(`Update failed: ${errorMessage}` + (errorData.details ? ` (Details: ${errorData.details})` : ''));
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data || !data.hardware_installation) {
        const errorMessage = 'Update seemed to succeed but did not return the updated hardware installation.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      const updatedHardware = data.hardware_installation as HardwareInstallation;

      setHardwareInstallations(prev =>
        prev.map(hw =>
          hw.install_id === updatedHardware.install_id ? updatedHardware : hw
        ).sort((a,b) => a.install_id - b.install_id)
      );
      setSelectedHardware(updatedHardware);

    } catch (err) {
      console.error("Failed to update hardware installation:", err);
      const displayError = err instanceof Error ? err.message : String(err);
      if (!error?.includes(displayError)) {
        setError(prevError => prevError ? `${prevError}. ${displayError}` : displayError);
      }
    }
  };

  const testBenchOptions: SelectOption[] = testBenches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name || 'N/A' }));
  const groupTypeOptions: SelectOption[] = hardwareGroupTypes.map(hgt => ({ value: String(hgt.hardware_group_id), label: hgt.group_name }));

  const addEntryFields: ModalField[] = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenchOptions
    },
    {
      name: 'hardware_group_id',
      label: 'Hardware Group',
      type: 'select',
      required: true,
      options: groupTypeOptions
    },
    { name: 'description', label: 'Description', type: 'text', required: false },
    { name: 'hardware_number', label: 'Hardware Number', type: 'text', required: false },
    { name: 'part_number', label: 'Part Number', type: 'text', required: false },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
    { name: 'software_version', label: 'Software Version', type: 'text', required: false },
    { name: 'installation_date', label: 'Installation Date', type: 'date', required: false },
  ];

  const modalFields: ModalField[] = [
    { name: 'install_id', label: 'Install ID', type: 'number', editable: false }, 
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: testBenchOptions,
      editable: true
    },
    {
      name: 'hardware_group_id',
      label: 'Hardware Group',
      type: 'select',
      required: true,
      options: groupTypeOptions,
      editable: true
    },
    // group_name and hil_name are derived, so not directly editable here.
    // { name: 'group_name', label: 'Group Name', type: 'text', editable: false },
    // { name: 'hil_name', label: 'HIL Name', type: 'text', editable: false },
    { name: 'description', label: 'Description', type: 'text', editable: true },
    { name: 'hardware_number', label: 'Hardware Number', type: 'text', editable: true },
    { name: 'part_number', label: 'Part Number', type: 'text', editable: true },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text', editable: true },
    { name: 'software_version', label: 'Software Version', type: 'text', editable: true },
    { name: 'installation_date', label: 'Installation Date', type: 'date', editable: true },
  ];


  return (
    <>
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Tool size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Hardware Installations {hardwareInstallations.length > 0 ? `(${hardwareInstallations.length})` : ''}</h1>
        </div>
        <button 
            onClick={handleAddClick} 
            style={{
                ...styles.addButton,
                ...( (isReadOnly || permissionsLoading) ? { cursor: 'not-allowed', opacity: 0.7 } : {}),
            }}
            disabled={isReadOnly || permissionsLoading}
            title={isReadOnly ? "Read-only: Cannot add new entries" : "Add new Hardware Installation"}
        >
            {(isReadOnly && !permissionsLoading) && <Ban size={16} style={{ marginRight: '0.5rem' }} />}
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Add Hardware
        </button>
      </div>

      {error && (
        <div style={styles.errorContainer} role="alert">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {selectedHardware && (
        <EditableDetailsModal
          isOpen={!!selectedHardware}
          onClose={() => setSelectedHardware(null)}
          data={selectedHardware} 
          fields={modalFields} 
          onSave={handleUpdateHardware}
          title={`Edit Hardware: ${selectedHardware.description || 'N/A'}`}
          isReadOnly={isReadOnly}
        />
      )}

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        fields={addEntryFields}
        onSave={handleSaveEntry}
        title="Add New Hardware Installation"
        isReadOnly={isReadOnly}
      />

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeaderCell}>Test Bench (HiL Name)</th>
              <th style={styles.tableHeaderCell}>Hardware Group</th>
              <th style={styles.tableHeaderCell}>Description</th>
              <th style={styles.tableHeaderCell}>Hardware No.</th>
              <th style={styles.tableHeaderCell}>Part No.</th>
              <th style={styles.tableHeaderCell}>SW Version</th>
              <th style={styles.tableHeaderCell}>Manufacturer</th>
              <th style={styles.tableHeaderCell}>Installation Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={styles.noDataCell}>
                  <div style={styles.loadingContainer}>
                    <RefreshCw size={24} style={styles.loadingIcon} />
                    <span>Loading hardware data...</span>
                  </div>
                </td>
              </tr>
            ) : hardwareInstallations.length === 0 && !error ? (
              <tr>
                <td colSpan={8} style={styles.noDataCell}>No hardware installations found.</td>
              </tr>
            ) : (
              hardwareInstallations.map((hw) => (
                <tr 
                  key={hw.install_id} 
                  onClick={() => handleRowClick(hw)} 
                  style={styles.tableBodyRow}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.tableBodyCell}>{hw.hil_name ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.group_name ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.description ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.hardware_number ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.part_number ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.software_version ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.manufacturer ?? 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{hw.installation_date ? new Date(hw.installation_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
} 