'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { PcCase as Cpu, RefreshCw, PlusCircle, Ban } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { PcOverview, TestBench, Software } from '../../types/database';
import ManagePCSwAssignments from './ManagePCSwAssignments';
import ManagePCLicenseAssignments from './ManagePCLicenseAssignments';
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

// Add type definition for assigned license data (matches API response - now snake_case)
interface AssignedLicenseInfo {
    license_id: number;
    license_name: string | null;
    license_type: string | null;
    software_name: string;
    major_version: string | null;
    assigned_on: string | null; 
}

export default function PcOverviewList() {
  const [pc_overviews, setPcOverviews] = useState<PcOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected_pc, setSelectedPc] = useState<PcOverview | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [test_benches, setTestBenches] = useState<TestBench[]>([]); // For dropdown

  const { permissionName, isLoading: permissionsLoading } = usePermissions();
  const isReadOnly = permissionName === 'Read';

  // State for software relationship management
  const [all_software, setAllSoftware] = useState<Software[]>([]);
  const [assigned_software_ids, setAssignedSoftwareIds] = useState<number[]>([]);
  const [assignment_loading, setAssignmentLoading] = useState(false);
  const [assignment_error, setAssignmentError] = useState<string | null>(null);

  // State for license assignment management
  const [assigned_licenses, setAssignedLicenses] = useState<AssignedLicenseInfo[]>([]);
  const [license_assignment_loading, setLicenseAssignmentLoading] = useState(false);
  const [license_assignment_error, setLicenseAssignmentError] = useState<string | null>(null);

  const fetchRelatedData = async () => {
    try {
      const [tbResponse, swResponse] = await Promise.all([
        fetch('/api/testbenches'),
        fetch('/api/software'),
      ]);

      if (tbResponse.ok) {
        const tbData = await tbResponse.json();
        setTestBenches(tbData.test_benches || []);
      } else {
        console.error('Failed to fetch test benches for dropdown');
        setTestBenches([]);
      }

      if (swResponse.ok) {
        const swData = await swResponse.json();
        setAllSoftware(swData.software || []);
      } else {
        console.error('Failed to fetch software for assignment');
        setAllSoftware([]);
      }
    } catch (err) {
      console.error('Error fetching related data (benches/software):', err);
      setTestBenches([]);
      setAllSoftware([]);
    }
  };

  const fetchAssignedSoftware = async (pc_id: number) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${pc_id}/software`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned software');
      }
      const data = await response.json();
      const assignments = data.softwareAssignments || []; // API returns snake_case
      if (!Array.isArray(assignments)) {
        console.error("softwareAssignments received from API is not an array:", assignments);
        setAssignedSoftwareIds([]);
      } else {
        setAssignedSoftwareIds(assignments.map((a: any) => a.software_id));
      }
    } catch (err) {
      console.error(`Error fetching assigned software for PC ${pc_id}:`, err);
      setAssignmentError('Failed to load assigned software.');
      setAssignedSoftwareIds([]); // Clear on error
    } finally {
      setAssignmentLoading(false);
    }
  };

  const fetchAssignedLicenses = async (pc_id: number) => {
    setLicenseAssignmentLoading(true);
    setLicenseAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${pc_id}/licenses`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned licenses');
      }
      const data = await response.json();
      const licenses = data.assignedLicenses || []; // API now returns snake_case
      if (!Array.isArray(licenses)) {
        console.error("assignedLicenses received from API is not an array:", licenses);
        setAssignedLicenses([]);
      } else {
        setAssignedLicenses(licenses as AssignedLicenseInfo[]);
      }      
    } catch (err) {
      console.error(`Error fetching assigned licenses for PC ${pc_id}:`, err);
      setLicenseAssignmentError('Failed to load assigned licenses.');
      setAssignedLicenses([]); // Clear on error
    } finally {
      setLicenseAssignmentLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pcs');
      if (!response.ok) {
        throw new Error('Failed to fetch PC overviews');
      }
      const data = await response.json();
      setPcOverviews(data.pcs || []); // API returns snake_case
    } catch (err) {
      setError('Error loading PC overviews: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching PC overviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData(); // Fetch main PC list
      await fetchRelatedData(); // Fetch related benches and software
    };
    loadInitialData();
  }, []);

  const handleAddClick = () => {
    if (isReadOnly || permissionsLoading) return;
    setIsAddModalOpen(true);
  };

  const handleRowClick = async (pc: PcOverview) => {
    setSelectedPc(pc);
    if (pc.pc_id !== undefined) {
        await fetchAssignedSoftware(pc.pc_id);
        await fetchAssignedLicenses(pc.pc_id);
    }
  }

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Construct payload with only expected fields for pc_overview
      const savePayload: any = {
        // pc_id is auto-generated by the database
        pc_name: formData.pc_name,
        bench_id: formData.bench_id ? Number(formData.bench_id) : null,
        casual_name: formData.casual_name || null,
        purchase_year: formData.purchase_year ? Number(formData.purchase_year) : null,
        inventory_number: formData.inventory_number || null,
        pc_role: formData.pc_role || null,
        pc_model: formData.pc_model || null,
        special_equipment: formData.special_equipment || null,
        mac_address: formData.mac_address || null,
        ip_address: formData.ip_address || null,
        pc_info_text: formData.pc_info_text || null,
        status: formData.status || null, // Default status could be set by DB or API if not provided
        active_user: formData.active_user || null,
      };

      // Validate required fields in the payload
      if (savePayload.bench_id === null || savePayload.bench_id === undefined) {
        throw new Error('Test Bench ID (bench_id) is required.');
      }
      if (!savePayload.pc_name) {
        throw new Error('PC Name (pc_name) is required.');
      }

      const response = await fetch('/api/pcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Failed to add PC overview:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      const new_pc = result.pc as PcOverview;

      if (result.success && new_pc) {
        setPcOverviews(prevPcs => [...prevPcs, new_pc].sort((a,b) => (a.pc_id ?? 0) - (b.pc_id ?? 0)));
        setIsAddModalOpen(false);
      } else {
        console.error("API did not return success or new PC data:", result);
        throw new Error(result.error || "Failed to process save response from server.");
      }

    } catch (err: any) {
      console.error("Failed to save PC overview:", err);
      throw err;
    }
  };

  const handleUpdatePc = async (formData: Record<string, any>) => {
    try {
      if (!formData.pc_id) {
        throw new Error('PC ID (pc_id) is required for update');
      }
      const pcId = formData.pc_id;

      // Construct payload with only expected fields for pc_overview
      const updatePayload: any = {
        pc_id: pcId,
        pc_name: formData.pc_name,
        bench_id: formData.bench_id ? Number(formData.bench_id) : null,
        casual_name: formData.casual_name || null,
        purchase_year: formData.purchase_year ? Number(formData.purchase_year) : null,
        inventory_number: formData.inventory_number || null,
        pc_role: formData.pc_role || null,
        pc_model: formData.pc_model || null,
        special_equipment: formData.special_equipment || null,
        mac_address: formData.mac_address || null,
        ip_address: formData.ip_address || null,
        pc_info_text: formData.pc_info_text || null,
        status: formData.status || null,
        active_user: formData.active_user || null,
      };

      // Validate required fields in the payload
      if (updatePayload.bench_id === null || updatePayload.bench_id === undefined) {
        throw new Error('Test Bench ID (bench_id) is required for update.');
      }
      if (!updatePayload.pc_name) {
        throw new Error('PC Name (pc_name) is required for update.');
      }

      const response = await fetch('/api/pcs', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Failed to update PC overview:', errorData);
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      const updated_pc = result.pc as PcOverview;

      if (result.success && updated_pc) {
        setPcOverviews(prevPcs =>
          prevPcs.map(p =>
            p.pc_id === updated_pc.pc_id ? updated_pc : p
          )
        );
        if (selected_pc?.pc_id === updated_pc.pc_id) {
             setSelectedPc(updated_pc);
        }
      } else {
        console.error("API did not return success or updated PC data:", result);
        throw new Error(result.error || "Failed to process update response from server.");
      }

    } catch (err: any) {
      console.error("Error in handleUpdatePc:", err);
      throw err;
    }
  };

  // --- Handlers for Assigning/Unassigning Software --- 
  const handleAssignSoftware = async (software_id: number) => {
    if (isReadOnly || permissionsLoading) return;
    if (!selected_pc?.pc_id) {
      console.error("Cannot assign software: No PC selected.");
      setAssignmentError("Cannot assign software: No PC selected.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selected_pc.pc_id}/software`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ software_id }), // API expects snake_case
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign software');
      }
      // Re-fetch assigned software to update the list
      await fetchAssignedSoftware(selected_pc.pc_id);
    } catch (err) {
      console.error("Error assigning software:", err);
      const errorMsg = 'Failed to assign software: ' + (err instanceof Error ? err.message : String(err));
      setAssignmentError(errorMsg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignSoftware = async (software_id: number) => {
    if (isReadOnly || permissionsLoading) return;
    if (!selected_pc?.pc_id) {
      console.error("Cannot unassign software: No PC selected.");
      setAssignmentError("Cannot unassign software: No PC selected.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selected_pc.pc_id}/software/${software_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign software');
      }
      // Re-fetch assigned software to update the list
      await fetchAssignedSoftware(selected_pc.pc_id);
    } catch (err) {
      console.error("Error unassigning software:", err);
      const errorMsg = 'Failed to unassign software: ' + (err instanceof Error ? err.message : String(err));
      setAssignmentError(errorMsg);
    } finally {
      setAssignmentLoading(false);
    }
  };
  // --- End Software Assignment Handlers ---

  // --- Handlers for Assigning/Unassigning Licenses ---
  const handleUnassignPcLicense = async (license_id: number) => {
    if (isReadOnly || permissionsLoading) return;
    if (!selected_pc?.pc_id) {
      setLicenseAssignmentError("No PC selected to unassign license from.");
      return;
    }
    setLicenseAssignmentLoading(true);
    setLicenseAssignmentError(null);
    try {
      const response = await fetch(`/api/pcs/${selected_pc.pc_id}/licenses/${license_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign license');
      }
      await fetchAssignedLicenses(selected_pc.pc_id);
    } catch (err) {
      console.error(`Error unassigning license ${license_id} from PC ${selected_pc.pc_id}:`, err);
      setLicenseAssignmentError(err instanceof Error ? err.message : 'Could not unassign license.');
    } finally {
      setLicenseAssignmentLoading(false);
    }
  };
  // --- End License Assignment Handlers ---

  const getBenchName = (id: number | null | undefined): string => {
    if (id === null || id === undefined) return 'N/A';
    if (test_benches.length === 0 && loading) return 'Loading...'; // Add loading check for benches
    return test_benches.find(tb => tb.bench_id === id)?.hil_name || 'Unknown Bench';
  };

  // Define fields for the add entry modal (snake_case)
  const addEntryFields: ModalField[] = [
    { name: 'pc_name', label: 'PC Name', type: 'text', required: true },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select Test Bench' },
        ...test_benches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
      ]
    },
    { name: 'casual_name', label: 'Casual Name', type: 'text' },
    { name: 'purchase_year', label: 'Purchase Year', type: 'number' },
    { name: 'inventory_number', label: 'Inventory Number', type: 'text' },
    { name: 'pc_role', label: 'Role', type: 'text' },
    { name: 'pc_model', label: 'Model', type: 'text' },
    { name: 'special_equipment', label: 'Special Equipment', type: 'text' },
    { name: 'mac_address', label: 'MAC Address', type: 'text' },
    { name: 'ip_address', label: 'IP Address', type: 'text' },
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'active_user', label: 'Active User', type: 'text' },
    { name: 'pc_info_text', label: 'Info Text', type: 'text' }, 
  ];

  const detailsFields: ModalField[] = [
    { name: 'pc_id', label: 'PC ID', type: 'number', editable: false },
    { name: 'pc_name', label: 'PC Name', type: 'text', required: true, editable: true },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select',
      required: true,
      editable: true,
      options: [
        { value: '', label: 'Select Test Bench' },
        ...test_benches.map(tb => ({ value: String(tb.bench_id), label: tb.hil_name }))
      ]
    },
    { name: 'hil_name', label: 'Test Bench Name', type: 'text', editable: false }, // Display only for linked bench
    { name: 'casual_name', label: 'Casual Name', type: 'text', editable: true },
    { name: 'purchase_year', label: 'Purchase Year', type: 'number', editable: true },
    { name: 'inventory_number', label: 'Inventory Number', type: 'text', editable: true },
    { name: 'pc_role', label: 'Role', type: 'text', editable: true },
    { name: 'pc_model', label: 'Model', type: 'text', editable: true },
    { name: 'special_equipment', label: 'Special Equipment', type: 'text', editable: true },
    { name: 'mac_address', label: 'MAC Address', type: 'text', editable: true },
    { name: 'ip_address', label: 'IP Address', type: 'text', editable: true },
    { name: 'status', label: 'Status', type: 'text', editable: true },
    { name: 'active_user', label: 'Active User', type: 'text', editable: true },
    { name: 'pc_info_text', label: 'Info Text', type: 'text', editable: true },
    { name: 'created_at', label: 'Created At', type: 'text', editable: false },
    { name: 'updated_at', label: 'Updated At', type: 'text', editable: false },
  ];

  // Helper object for table styles (optional, keeps JSX cleaner)
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
    assignmentSection: {
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb',
    },
    assignmentTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '1rem',
    },
    assignmentList: {
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        padding: '0.5rem',
    },
    assignmentItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        borderBottom: '1px solid #f3f4f6',
    },
    assignmentItemLast: {
        borderBottom: 'none',
    },
    assignmentDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1rem'
    },
    assignmentTextMuted: {
        fontSize: '0.75rem',
        color: '#6b7280',
    },
    noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Cpu size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>PC Overviews {pc_overviews.length > 0 ? `(${pc_overviews.length})` : ''}</h1>
        </div>
        <button 
            onClick={handleAddClick} 
            style={{
                ...styles.addButton,
                ...( (isReadOnly || permissionsLoading) ? { cursor: 'not-allowed', opacity: 0.7 } : {}),
            }}
            disabled={isReadOnly || permissionsLoading}
            title={isReadOnly ? "Read-only: Cannot add new entries" : "Add new PC Overview"}
        >
            {(isReadOnly && !permissionsLoading) && <Ban size={16} style={{ marginRight: '0.5rem' }} />}
            <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
            Add PC
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading PC overviews...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>PC Name</th>
                <th style={styles.tableHeaderCell}>Test Bench</th>
                <th style={styles.tableHeaderCell}>Platform</th>
                <th style={styles.tableHeaderCell}>MAC Address</th>
                <th style={styles.tableHeaderCell}>IP Address</th>
                <th style={styles.tableHeaderCell}>Role</th>
                <th style={styles.tableHeaderCell}>Inventory No.</th>
                <th style={styles.tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pc_overviews.length === 0 ? (
                <tr><td colSpan={8} style={styles.noDataCell}>No PC overviews found.</td></tr>
              ) : (
                pc_overviews.map((pc) => (
                  <tr 
                    key={pc.pc_id} 
                    style={styles.tableBodyRow} 
                    onClick={() => handleRowClick(pc)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{pc.pc_name ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.hil_name ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.platform_name ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.mac_address ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.ip_address ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.pc_role ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.inventory_number ?? 'N/A'}</td>
                    <td style={styles.tableBodyCell}>{pc.status ?? 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selected_pc && (
        <EditableDetailsModal
          isOpen={!!selected_pc}
          onClose={() => { 
            setSelectedPc(null); 
            setError(null); 
            setAssignmentError(null); 
            setLicenseAssignmentError(null);
            setAssignedSoftwareIds([]); // Clear software assignments
            setAssignedLicenses([]); // Clear license assignments
          }}
          data={selected_pc} // Pass snake_case data
          fields={detailsFields}
          onSave={handleUpdatePc}
          title={`Edit PC Overview (ID: ${selected_pc.pc_id})`}
          isReadOnly={isReadOnly}
        >
          {/* Software Assignment Section */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecef' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#343a40', marginBottom: '1rem' }}>Manage Software Assignments</h3>
            <ManagePCSwAssignments
              pc_id={selected_pc.pc_id} 
              all_software={all_software} 
              assigned_software_ids={assigned_software_ids} 
              on_assign={handleAssignSoftware}
              on_unassign={handleUnassignSoftware}
              is_loading={assignment_loading}
              error={assignment_error}
              isReadOnly={isReadOnly}
            />
          </div>

          {/* License Assignment Section - Updated Props */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecef' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#343a40', marginBottom: '1rem' }}>Assigned Licenses</h3>
            <ManagePCLicenseAssignments
              pc_id={selected_pc.pc_id}
              assigned_licenses={assigned_licenses}
              on_unassign={handleUnassignPcLicense}
              is_loading={license_assignment_loading}
              error={license_assignment_error}
              isReadOnly={isReadOnly}
            />
          </div>
        </EditableDetailsModal>
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New PC Overview"
          fields={addEntryFields}
          onSave={handleSaveEntry}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
} 