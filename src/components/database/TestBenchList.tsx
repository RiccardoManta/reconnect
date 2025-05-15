'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Server, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '@/components/EditableDetailsModal';
import AddEntryModal from '@/components/AddEntryModal';
import { TestBench, Project, ModelStand, Platform } from '@/types/database';
import { ColumnDef } from "@tanstack/react-table";

// Define field types for modals
type FieldType = 'text' | 'number' | 'date' | 'select';

interface SelectOption {
  value: string;
  label: string;
}

interface BaseField {
  name: string; // Will be snake_case
  label: string;
  required?: boolean;
  editable?: boolean;
}

interface TextField extends BaseField {
  type: 'text';
}

interface NumberField extends BaseField {
    type: 'number';
}

interface DateField extends BaseField {
  type: 'date';
}

interface SelectField extends BaseField {
  type: 'select';
  options: SelectOption[];
}

type ModalField = TextField | NumberField | DateField | SelectField;

// --- Styles (Copied from HardwareInstallationList for consistency, can be centralized) --- 
const styles: { [key: string]: CSSProperties } = {
  headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
  headerTitleContainer: { display: 'flex', alignItems: 'center' },
  headerIcon: { color: '#0F3460', marginRight: '1rem' }, // Adjusted icon color
  headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
  buttonCommon: { 
      border: 'none', 
      borderRadius: '0.375rem', 
      padding: '0.5rem 0.75rem', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      fontSize: '0.875rem', 
      fontWeight: 500, 
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
      color: 'white' 
  },
  addButton: { backgroundColor: '#39A2DB' }, // Specific color for add
  refreshButton: { backgroundColor: '#5A67D8', marginRight: '1rem' }, // Specific color for refresh
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

const columns: ColumnDef<TestBench>[] = [
  {
    accessorKey: "hil_name",
    header: "Test Bench (HiL Name)",
  },
  {
    accessorKey: "platform_name",
    header: "Platform",
  },
  {
    accessorKey: "bench_type",
    header: "Bench Type",
  },
  {
    accessorKey: "project_name",
    header: "Project",
  },
  {
    accessorKey: "system_type",
    header: "System Type",
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
  },
  {
    accessorKey: "inventory_number",
    header: "Inventory No.",
  },
];

const columnVisibility = {};

export default function TestBenchList() {
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestBench, setSelectedTestBench] = useState<TestBench | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modelStands, setModelStands] = useState<ModelStand[]>([]);
  // Assuming system_types and bench_types are fetched as simple string arrays directly in snake_case
  const [systemTypes, setSystemTypes] = useState<string[]>([]);
  const [benchTypes, setBenchTypes] = useState<string[]>([]);

  const fetchRelatedData = async () => {
    try {
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []); // Assuming API returns { projects: [...] } with snake_case
      }

      const modelStandsResponse = await fetch('/api/modelstands');
      if (modelStandsResponse.ok) {
        const modelStandsData = await modelStandsResponse.json();
        setModelStands(modelStandsData.model_stands || []); // Assuming API returns { model_stands: [...] }
      }

      const systemTypesResponse = await fetch('/api/system-types'); // Endpoint TBD
      if (systemTypesResponse.ok) {
        const systemTypesData = await systemTypesResponse.json();
        setSystemTypes(systemTypesData.system_types || []); // Assuming API returns { system_types: [...] }
      }

      const benchTypesResponse = await fetch('/api/bench-types'); // Endpoint TBD
      if (benchTypesResponse.ok) {
        const benchTypesData = await benchTypesResponse.json();
        setBenchTypes(benchTypesData.bench_types || []); // Assuming API returns { bench_types: [...] }
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
      // Optionally set an error state for related data fetching
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/testbenches');
      if (!response.ok) {
        throw new Error('Failed to fetch test benches');
      }
      const data = await response.json();
      setTestBenches(data.test_benches || []); // Expecting { test_benches: [...] }
    } catch (err) {
      setError('Error loading test benches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching test benches:', err);
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
    setIsAddModalOpen(true);
  };

  const handleRowClick = (bench: TestBench) => {
    setSelectedTestBench(bench);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Format acquisition_date to YYYY-MM-DD if it exists and is a valid date
      if (formData.acquisition_date) {
        try {
          const date = new Date(formData.acquisition_date);
          if (!isNaN(date.getTime())) {
            formData.acquisition_date = date.toISOString().split('T')[0];
          } else {
            formData.acquisition_date = null; // Invalid date becomes null
          }
        } catch (e) {
          console.warn('Could not parse acquisition_date for new entry, setting to null:', formData.acquisition_date, e);
          formData.acquisition_date = null;
        }
      } else if (formData.acquisition_date === '' || formData.acquisition_date === undefined) {
        // Ensure empty or undefined becomes null explicitly for POST too
        formData.acquisition_date = null;
      }
      
      // Ensure numeric fields are numbers or null
      const numericFields = ['project_id', 'model_id', 'purchase_price'];
      for (const field of numericFields) {
        if (formData[field] !== undefined && formData[field] !== null && String(formData[field]).trim() !== '') {
          formData[field] = Number(formData[field]);
          if (isNaN(formData[field])) {
            // This case should ideally be caught by form validation, but as a fallback:
            console.error(`Invalid numeric value for ${field} during save: ${formData[field]}`);
            formData[field] = null; // Or throw error: throw new Error(`Invalid numeric value for ${field}`);
          }
        } else {
          formData[field] = null; // Set to null if empty, undefined, or only whitespace
        }
      }

      const response = await fetch('/api/testbenches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response for save' }));
        console.error('Failed to add test bench:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status} while adding test bench`);
      }
      const savedData = await response.json();
      if (savedData.success && savedData.test_bench) {
        const newBench = savedData.test_bench as TestBench;
        setTestBenches(prev => [...prev, newBench].sort((a, b) => a.bench_id - b.bench_id));
        setIsAddModalOpen(false);
      } else {
        throw new Error(savedData.error || 'Failed to add test bench or no test_bench returned');
      }
    } catch (err) {
       console.error("Failed to save entry:", err);
       throw err; 
    }
  };

  const handleUpdateTestBench = async (formData: Record<string, any>) => {
    try {
      if (formData.bench_id === undefined || formData.bench_id === null) {
        console.error('Test bench ID (bench_id) is required for update.', formData);
        throw new Error('Test bench ID (bench_id) is required for update');
      }
      const benchId = formData.bench_id;

      const { bench_id, project_name, model_name, platform_name, ...updatePayload } = formData;

      if (updatePayload.project_id !== undefined) {
        updatePayload.project_id = updatePayload.project_id === '' || updatePayload.project_id === null ? null : Number(updatePayload.project_id);
      }
      if (updatePayload.model_id !== undefined) {
        updatePayload.model_id = updatePayload.model_id === '' || updatePayload.model_id === null ? null : Number(updatePayload.model_id);
      }
      if (updatePayload.purchase_price !== undefined) {
        updatePayload.purchase_price = updatePayload.purchase_price === '' || updatePayload.purchase_price === null ? null : parseFloat(String(updatePayload.purchase_price));
      }
      
      // Format acquisition_date to YYYY-MM-DD if it exists and is a valid date
      if (updatePayload.acquisition_date) {
        try {
          const date = new Date(updatePayload.acquisition_date);
          // Check if date is valid after parsing
          if (!isNaN(date.getTime())) {
            updatePayload.acquisition_date = date.toISOString().split('T')[0];
          } else {
            // If date is invalid after parsing (e.g., empty string or malformed), set to null or handle as error
            // Current logic already sets empty string to null before this block for updates.
            // If it was not empty but became invalid, setting to null might be safest if DB allows null.
            updatePayload.acquisition_date = null; 
          }
        } catch (e) {
          // If Date constructor throws for some reason, or if not a parsable date string
          console.warn('Could not parse acquisition_date, setting to null:', updatePayload.acquisition_date, e);
          updatePayload.acquisition_date = null;
        }
      } else if (updatePayload.acquisition_date === '') { // Handle if it was explicitly cleared
        updatePayload.acquisition_date = null;
      }

      const response = await fetch(`/api/testbenches/${benchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Failed to update test bench:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.test_bench) {
        setTestBenches(prevBenches => 
          prevBenches.map(bench => 
            bench.bench_id === result.test_bench.bench_id ? result.test_bench : bench
          ).sort((a, b) => a.bench_id - b.bench_id)
        );
      } else {
        throw new Error(result.error || 'Failed to update test bench from API or no test_bench returned');
      }
    } catch (err: any) {
      console.error('Error in handleUpdateTestBench:', err);
      throw err; 
    }
  };

  const projectOptions: SelectOption[] = projects.map(project => ({
    value: String(project.project_id),
    label: project.project_name || 'Unnamed Project',
  }));

  const modelStandOptions: SelectOption[] = modelStands.map(model => ({
    value: String(model.model_id),
    label: model.model_name || 'Unnamed Model',
  }));

  const systemTypeOptions: SelectOption[] = systemTypes.map(type => ({ value: type, label: type }));
  const benchTypeOptions: SelectOption[] = benchTypes.map(type => ({ value: type, label: type }));

  const addEntryFields: ModalField[] = [
    { name: 'hil_name', label: 'HIL Name', type: 'text', required: true },
    { name: 'pp_number', label: 'PP Number', type: 'text' },
    { name: 'system_type', label: 'System Type', type: 'text' },
    { name: 'bench_type', label: 'Bench Type', type: 'text' },
    { name: 'acquisition_date', label: 'Acquisition Date', type: 'date' },
    { name: 'usage_period', label: 'Usage Period', type: 'text' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'inventory_number', label: 'Inventory Number', type: 'text' },
    { name: 'eplan', label: 'E-Plan', type: 'text' },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
    { name: 'bench_generation', label: 'Bench Generation', type: 'text' },
    { name: 'purchase_price', label: 'Purchase Price', type: 'number' },
    { name: 'project_contact', label: 'Project Contact', type: 'text' },
    { name: 'project_id', label: 'Project', type: 'select', options: projectOptions },
    { name: 'model_id', label: 'Model Stand', type: 'select', options: modelStandOptions, required: false },
  ];

  const detailsFields: ModalField[] = [
    { name: 'bench_id', label: 'Bench ID', type: 'number', editable: false },
    { name: 'hil_name', label: 'HIL Name', type: 'text', required: true, editable: true },
    { name: 'pp_number', label: 'PP Number', type: 'text', editable: true },
    { name: 'system_type', label: 'System Type', type: 'select', options: systemTypeOptions, editable: true },
    { name: 'bench_type', label: 'Bench Type', type: 'select', options: benchTypeOptions, editable: true },
    { name: 'acquisition_date', label: 'Acquisition Date', type: 'date', editable: true },
    { name: 'usage_period', label: 'Usage Period', type: 'text', editable: true },
    { name: 'location', label: 'Location', type: 'text', editable: true },
    { name: 'inventory_number', label: 'Inventory Number', type: 'text', editable: true },
    { name: 'eplan', label: 'E-Plan', type: 'text', editable: true },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text', editable: true },
    { name: 'bench_generation', label: 'Bench Generation', type: 'text', editable: true },
    { name: 'purchase_price', label: 'Purchase Price', type: 'number', editable: true },
    { name: 'project_contact', label: 'Project Contact', type: 'text', editable: true },
    { name: 'project_id', label: 'Project', type: 'select', options: projectOptions, editable: true },
    { name: 'model_id', label: 'Model Stand', type: 'select', options: modelStandOptions, required: false, editable: true },
  ];

  return (
    <>
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Server size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>Test Benches</h1>
        </div>
        <div>
          <button onClick={handleAddClick} style={{...styles.buttonCommon, ...styles.addButton}} disabled={loading}>
            <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
            Add Test Bench
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer} role="alert">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {selectedTestBench && (
        <EditableDetailsModal
          isOpen={!!selectedTestBench}
          onClose={() => { setSelectedTestBench(null); setError(null); }} // Clear error on close
          data={selectedTestBench} // Data is already snake_case
          fields={detailsFields} 
          onSave={handleUpdateTestBench}
          title={`Edit Test Bench (ID: ${selectedTestBench.bench_id})`}
        />
      )}

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        fields={addEntryFields}
        onSave={handleSaveEntry}
        title="Add New Test Bench"
      />

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeaderCell}>Test Bench (HiL Name)</th>
              <th style={styles.tableHeaderCell}>Platform</th>
              <th style={styles.tableHeaderCell}>Bench Type</th>
              <th style={styles.tableHeaderCell}>Project</th>
              <th style={styles.tableHeaderCell}>Manufacturer</th>
              <th style={styles.tableHeaderCell}>Location</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={styles.noDataCell}>
                  <div style={styles.loadingContainer}>
                    <RefreshCw size={24} style={styles.loadingIcon} />
                    <span>Loading test benches...</span>
                  </div>
                </td>
              </tr>
            ) : testBenches.length === 0 && !error ? (
              <tr>
                <td colSpan={6} style={styles.noDataCell}>No test benches found.</td>
              </tr>
            ) : (
              testBenches.map((bench) => (
                <tr 
                  key={bench.bench_id} 
                  onClick={() => handleRowClick(bench)} 
                  style={styles.tableBodyRow}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.tableBodyCell}>{bench.hil_name}</td>
                  <td style={styles.tableBodyCell}>{bench.platform_name || 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{bench.bench_type || '-'}</td>
                  <td style={styles.tableBodyCell}>{bench.project_name || 'N/A'}</td>
                  <td style={styles.tableBodyCell}>{bench.manufacturer || '-'}</td>
                  <td style={styles.tableBodyCell}>{bench.location || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
} 