'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Cloud, RefreshCw, PlusCircle } from 'lucide-react';
import EditableDetailsModal from '../EditableDetailsModal';
import AddEntryModal from '../AddEntryModal';
import { VmInstance, Software } from '../../types/database';
import { keysToCamel, keysToSnake } from '../../utils/caseConverter';
import ManagePCSwAssignments from './ManagePCSwAssignments';

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

  // Fetch all software (needed for assignment dropdown)
  const fetchAllSoftware = async () => {
    if (allSoftware.length > 0) return; 
    try {
      const response = await fetch('/api/software');
      if (response.ok) {
        const data = await response.json();
        setAllSoftware(keysToCamel<Software[]>(data.software || []));
      } else {
        console.error('Failed to fetch software for assignment');
        setAllSoftware([]);
      }
    } catch (err) {
      console.error('Error fetching software:', err);
      setAllSoftware([]);
    }
  };

  // Fetch software specifically assigned to the selected VM
  const fetchAssignedVmSoftware = async (vmId: number) => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${vmId}/software`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assigned VM software');
      }
      const data = await response.json();
      const assignments = data.softwareAssignments || [];
      setAssignedSoftwareIds(assignments.map((a: any) => a.software_id));
    } catch (err) {
      console.error(`Error fetching assigned software for VM ${vmId}:`, err);
      setAssignmentError('Failed to load assigned software.');
      setAssignedSoftwareIds([]);
    } finally {
      setAssignmentLoading(false);
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
      setVmInstances(keysToCamel<VmInstance[]>(data.vmInstances || [])); 
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
  }, []);

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleRowClick = async (vmInstance: VmInstance) => {
    setSelectedVmInstance(vmInstance);
    await fetchAllSoftware();
    if (vmInstance.vmId !== undefined) {
      await fetchAssignedVmSoftware(vmInstance.vmId);
    }
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/vminstances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add VM instance');
      }

      const savedData = await response.json();
      const newVmInstance = keysToCamel<VmInstance>(savedData.vmInstance);
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
      if (!formData.vmId) {
        throw new Error('VM ID is required');
      }

      const snakeCaseData = keysToSnake(formData);
      console.log("Sending snake_case data to API:", snakeCaseData);
      
      const response = await fetch(`/api/vminstances/${formData.vmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
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
      const updatedVmInstance = keysToCamel<VmInstance>(data.vmInstance);

      setVmInstances(prev =>
        prev.map(vm =>
          vm.vmId === updatedVmInstance.vmId ? updatedVmInstance : vm
        )
      );
      
      if (selectedVmInstance?.vmId === updatedVmInstance.vmId) {
           setSelectedVmInstance(updatedVmInstance);
      }

    } catch (err) {
      console.error("Failed to update VM instance:", err);
      throw err;
    }
  };

  // --- Handlers for Assigning/Unassigning Software to VM --- 
  const handleAssignVmSoftware = async (softwareId: number) => {
    if (!selectedVmInstance?.vmId) {
      setAssignmentError("Cannot assign software: No VM selected.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${selectedVmInstance.vmId}/software`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ software_id: softwareId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign software to VM');
      }
      setAssignedSoftwareIds(prev => [...prev, softwareId].sort((a, b) => a - b));
    } catch (err) {
      const errorMsg = `Error assigning software: ${err instanceof Error ? err.message : String(err)}`;
      setAssignmentError(errorMsg);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassignVmSoftware = async (softwareId: number) => {
    if (!selectedVmInstance?.vmId) {
      setAssignmentError("Cannot unassign software: No VM selected.");
      return;
    }
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const response = await fetch(`/api/vms/${selectedVmInstance.vmId}/software/${softwareId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign software from VM');
      }
      setAssignedSoftwareIds(prev => prev.filter(id => id !== softwareId));
    } catch (err) {
      const errorMsg = `Error unassigning software: ${err instanceof Error ? err.message : String(err)}`;
      setAssignmentError(errorMsg);
    } finally {
      setAssignmentLoading(false);
    }
  };
  // --- End Assignment Handlers ---

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'vmName', label: 'VM Name', type: 'text', required: true },
    { name: 'vmAddress', label: 'VM Address', type: 'text', required: false },
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'vmId', label: 'VM ID', type: 'number', editable: false },
    { name: 'vmName', label: 'VM Name', type: 'text', required: true, editable: true },
    { name: 'vmAddress', label: 'VM Address', type: 'text', required: false, editable: true },
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
    assignmentTextMuted: { fontSize: '0.75rem', color: '#6b7280', }
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
                <th style={styles.tableHeaderCell}>ID</th>
                <th style={styles.tableHeaderCell}>VM Name</th>
                <th style={styles.tableHeaderCell}>VM Address</th>
              </tr>
            </thead>
            <tbody>
              {vmInstances.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No VM instances found</td></tr>
              ) : (
                vmInstances.map((vmInstance) => (
                  <tr key={vmInstance.vmId}
                    style={styles.tableBodyRow}
                    onClick={() => handleRowClick(vmInstance)}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={styles.tableBodyCell}>{vmInstance.vmId}</td>
                    <td style={styles.tableBodyCell}>{vmInstance.vmName}</td>
                    <td style={styles.tableBodyCell}>{vmInstance.vmAddress || '-'}</td>
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
          isOpen={selectedVmInstance !== null}
          onClose={() => setSelectedVmInstance(null)}
          title={`VM Details: ${selectedVmInstance.vmName}`}
          data={selectedVmInstance}
          fields={detailsFields}
          onSave={handleUpdateVmInstance}
        >
          <div style={styles.assignmentSection}>
            <ManagePCSwAssignments
              pcId={selectedVmInstance.vmId!}
              allSoftware={allSoftware}
              assignedSoftwareIds={assignedSoftwareIds}
              onAssign={handleAssignVmSoftware}
              onUnassign={handleUnassignVmSoftware}
              isLoading={assignmentLoading}
              error={assignmentError}
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