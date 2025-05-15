'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Cloud, RefreshCw, PlusCircle, ListChecks, Edit3 } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { VmInstance, Software } from '../../types/database';
import ManagePCSwAssignments from './ManagePCSwAssignments';
import ManageVMLicenseAssignments from './ManageVMLicenseAssignments';

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

// Add type definition for assigned license data (self-contained now)
interface AssignedLicenseInfo {
    license_id: number;
    license_name: string | null;
    license_type: string | null;
    software_name: string; // This typically comes from a join in the API for assigned licenses
    major_version: string | null; // Also from join
    assigned_on: string | null; 
}

export default function VmInstancesList() {
  const [vmInstances, setVmInstances] = useState<VmInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVmInstance, setSelectedVmInstance] = useState<VmInstance | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State for software relationship management
  const [allSoftware, setAllSoftware] = useState<Software[]>([]);
  const [assignedSoftwareIds, setAssignedSoftwareIds] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // State for VM license assignment management
  const [assignedLicenses, setAssignedLicenses] = useState<AssignedLicenseInfo[]>([]);
  const [licenseAssignmentLoading, setLicenseAssignmentLoading] = useState(false);
  const [licenseAssignmentError, setLicenseAssignmentError] = useState<string | null>(null);

  const fetchRelatedData = async () => {
    try {
      const [swResponse] = await Promise.all([
        fetch('/api/software'),
      ]);

      if (swResponse.ok) {
        const swData = await swResponse.json();
        setAllSoftware(swData.software || []);
      } else {
        console.error('Failed to fetch software for assignment');
        setAllSoftware([]);
      }

    } catch (err) {
      console.error('Error fetching related data (software):', err);
      setAllSoftware([]);
    }
  };

  const fetchAssignedVmSoftware = async (vm_id: number) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${vm_id}/software`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned VM software');
      }
      const data = await response.json();
      const assignments = data.softwareAssignments || [];
      setAssignedSoftwareIds(assignments.map((a: any) => a.software_id));
    } catch (err) {
      console.error(`Error fetching assigned software for VM ${vm_id}:`, err);
      setAssignmentError('Failed to load assigned software.');
      setAssignedSoftwareIds([]);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const fetchAssignedVmLicenses = async (vm_id: number) => {
    setLicenseAssignmentLoading(true);
    setLicenseAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${vm_id}/licenses`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned VM licenses');
      }
      const data = await response.json();
      setAssignedLicenses(data.assignedLicenses || []);
    } catch (err) {
      console.error(`Error fetching assigned licenses for VM ${vm_id}:`, err);
      setLicenseAssignmentError('Failed to load assigned licenses for VM.');
      setAssignedLicenses([]);
    } finally {
      setLicenseAssignmentLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/vminstances');
      if (!response.ok) {
        throw new Error('Failed to fetch VM instances');
      }
      const data = await response.json();
      setVmInstances(data.vm_instances || []); 
    } catch (err) {
      setError('Error loading VM instances: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching VM instances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
    fetchRelatedData();
  }, []);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleRowClick = async (vmInstance: VmInstance) => {
    setSelectedVmInstance(vmInstance);
    if (vmInstance.vm_id !== undefined) {
      await fetchAssignedVmSoftware(vmInstance.vm_id);
      await fetchAssignedVmLicenses(vmInstance.vm_id);
    }
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/vminstances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add VM instance');
      }

      const savedData = await response.json();
      const newVmInstance = savedData.vm_instance as VmInstance;
      setVmInstances(prev => [...prev, newVmInstance]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save VM instance:", err);
      throw err;
    }
  };

  const handleUpdateVmInstance = async (formData: Record<string, any>) => {
    console.log("Attempting to update VM instance. Form data:", formData);
    try {
      if (!formData.vm_id) {
        throw new Error('VM ID (vm_id) is required');
      }

      console.log("Sending snake_case data to API:", formData);
      
      const response = await fetch(`/api/vminstances/${formData.vm_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to update VM instance';
        try {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            errorMsg = errorData.error || errorMsg;
        } catch (jsonError) {
            console.error("Could not parse API error response as JSON");
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const updatedVmInstance = data.vm_instance as VmInstance;

      setVmInstances(prev =>
        prev.map(vm =>
          vm.vm_id === updatedVmInstance.vm_id ? updatedVmInstance : vm
        )
      );
      
      if (selectedVmInstance?.vm_id === updatedVmInstance.vm_id) {
           setSelectedVmInstance(updatedVmInstance);
      }

    } catch (err) {
      console.error("Failed to update VM instance:", err);
      throw err;
    }
  };

  // --- Handlers for Assigning/Unassigning Software to VM --- 
  const handleAssignVmSoftware = async (software_id: number) => {
    if (!selectedVmInstance?.vm_id) {
      setAssignmentError("No VM selected to assign software to.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${selectedVmInstance.vm_id}/software`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ software_id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign software to VM');
      }
      await fetchAssignedVmSoftware(selectedVmInstance.vm_id);
    } catch (err) {
      console.error("Error assigning software to VM:", err);
      setAssignmentError(err instanceof Error ? err.message : 'Could not assign software.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignVmSoftware = async (software_id: number) => {
    if (!selectedVmInstance?.vm_id) {
      setAssignmentError("No VM selected to unassign software from.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${selectedVmInstance.vm_id}/software/${software_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign software from VM');
      }
      await fetchAssignedVmSoftware(selectedVmInstance.vm_id);
    } catch (err) {
      console.error("Error unassigning software from VM:", err);
      setAssignmentError(err instanceof Error ? err.message : 'Could not unassign software.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // --- Handlers for Assigning/Unassigning Licenses to VM ---
  const handleUnassignVmLicense = async (license_id: number) => {
    if (!selectedVmInstance?.vm_id) {
      setLicenseAssignmentError("No VM selected to unassign license from.");
      return;
    }
    setLicenseAssignmentLoading(true);
    setLicenseAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${selectedVmInstance.vm_id}/licenses/${license_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign license from VM');
      }
      await fetchAssignedVmLicenses(selectedVmInstance.vm_id);
    } catch (err) {
      console.error("Error unassigning license from VM:", err);
      setLicenseAssignmentError(err instanceof Error ? err.message : 'Could not unassign license from VM.');
    } finally {
      setLicenseAssignmentLoading(false);
    }
  };

  // Define fields for the add entry modal using snake_case names
  const addEntryFields: ModalField[] = [
    { name: 'vm_name', label: 'VM Name', type: 'text', required: true },
    { name: 'vm_address', label: 'VM Address', type: 'text', required: false },
  ];

  // Define fields for the editable details modal using snake_case names
  const detailsFields: ModalField[] = [
    { name: 'vm_id', label: 'VM ID', type: 'number', editable: false },
    { name: 'vm_name', label: 'VM Name', type: 'text', required: true, editable: true },
    { name: 'vm_address', label: 'VM Address', type: 'text', required: false, editable: true },
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
    assignmentSection: { marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', },
    assignmentTitle: { fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', },
    assignmentList: { maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.5rem', },
    assignmentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', fontSize: '0.875rem', borderBottom: '1px solid #f3f4f6', },
    assignmentItemLast: { borderBottom: 'none', },
    assignmentDetails: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
    assignmentTextMuted: { fontSize: '0.75rem', color: '#6b7280', },
    buttonCommon: {
      border: 'none',
      borderRadius: '0.375rem',
      padding: '0.25rem 0.5rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    actionButton: {
      backgroundColor: '#39A2DB',
      color: 'white',
    },
    editButton: {
      backgroundColor: 'white',
      color: '#6b7280',
    },
  };

  return (
    <div>
      {/* Page Header */}
      <div style={styles.headerContainer}>
        <div style={styles.headerTitleContainer}>
          <Cloud size={28} style={styles.headerIcon} />
          <h1 style={styles.headerTitle}>VM Instances {vmInstances.length > 0 ? `(${vmInstances.length})` : ''}</h1>
        </div>
        <button
          onClick={handleAddClick}
          style={styles.addButton}
          title="Add new VM instance"
        >
          <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
          Add VM Instance
        </button>
      </div>

      {/* Table Container */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={24} style={styles.loadingSpinner} />
            <p style={{ margin: 0 }}>Loading VM instances...</p>
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}><p>{error}</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeaderCell}>VM Name</th>
                <th style={styles.tableHeaderCell}>VM Address</th>
              </tr>
            </thead>
            <tbody>
              {vmInstances.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No VM instances found</td></tr>
              ) : (
                vmInstances.map((vmInstance) => (
                  <tr key={vmInstance.vm_id}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(vmInstance)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{vmInstance.vm_name}</td>
                    <td style={styles.tableBodyCell}>{vmInstance.vm_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */} 
      {selectedVmInstance && (
        <EditableDetailsModal
          isOpen={!!selectedVmInstance}
          onClose={() => {
            setSelectedVmInstance(null);
            setAssignedSoftwareIds([]);
            setAssignedLicenses([]);
            setAssignmentError(null);
            setLicenseAssignmentError(null);
          }}
          data={selectedVmInstance}
          fields={detailsFields}
          onSave={handleUpdateVmInstance}
          title={`Edit VM Instance: ${selectedVmInstance.vm_name}`}
        >
          {/* Software Assignment Section */}
          <div style={styles.assignmentSection}>
            <h3 style={styles.assignmentTitle}>Manage Software Assignments</h3>
            <ManagePCSwAssignments
              pc_id={selectedVmInstance.vm_id ?? 0}
              all_software={allSoftware}
              assigned_software_ids={assignedSoftwareIds}
              on_assign={handleAssignVmSoftware}
              on_unassign={handleUnassignVmSoftware}
              is_loading={assignmentLoading}
              error={assignmentError}
            />
          </div>

          {/* License Assignment Section - Updated Props */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecef' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#343a40', marginBottom: '1rem' }}>Assigned Licenses</h3>
            <ManageVMLicenseAssignments
              vm_id={selectedVmInstance.vm_id}
              assigned_licenses={assignedLicenses}
              on_unassign={handleUnassignVmLicense}
              is_loading={licenseAssignmentLoading}
              error={licenseAssignmentError}
            />
          </div>
        </EditableDetailsModal>
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New VM Instance"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
} 