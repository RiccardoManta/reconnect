'use client';

import React, { useState } from 'react';
import { HardDrive, RefreshCw, Plus } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // State for software relationship management
  const [allSoftware, setAllSoftware] = useState<Software[]>([]);
  const [assignedSoftwareIds, setAssignedSoftwareIds] = useState<number[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Fetch all software (needed for assignment dropdown)
  const fetchAllSoftware = async () => {
    // Prevent re-fetching if already loaded
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
      const response = await fetch(`/api/vms/${vmId}/software`); // Use VM API endpoint
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
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      // Assuming the API endpoint is /api/vm-instances (adjust if different)
      const response = await fetch('/api/vminstances');
      if (!response.ok) {
        throw new Error('Failed to fetch VM instances');
      }
      const data = await response.json();
      // Convert incoming snake_case keys to camelCase
      setVmInstances(keysToCamel<VmInstance[]>(data.vmInstances || [])); 
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading VM instances: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching VM instances:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddModalOpen(true);
  };

  const handleRowClick = async (vmInstance: VmInstance) => {
    setSelectedVmInstance(vmInstance);
    await fetchAllSoftware(); // Ensure all software list is available
    if (vmInstance.vmId !== undefined) {
      await fetchAssignedVmSoftware(vmInstance.vmId);
    }
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Convert outgoing camelCase keys to snake_case
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

      // Refresh data - API returns snake_case, convert to camelCase
      const savedData = await response.json();
      const newVmInstance = keysToCamel<VmInstance>(savedData.vmInstance); // Adjust key if needed
      setVmInstances(prev => [...prev, newVmInstance]);
      setIsAddModalOpen(false);

    } catch (err) {
      console.error("Failed to save VM instance:", err);
      throw err;
    }
  };

  const handleUpdateVmInstance = async (formData: Record<string, any>) => {
    try {
      // Ensure vmId is present (camelCase)
      if (!formData.vmId) {
        throw new Error('VM ID is required');
      }

      // Convert outgoing camelCase keys to snake_case
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/vminstances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update VM instance');
      }

      // API returns updated record in snake_case, convert to camelCase
      const data = await response.json();
      const updatedVmInstance = keysToCamel<VmInstance>(data.vmInstance); // Adjust key if needed

      // Update local state with camelCase data
      setVmInstances(prev =>
        prev.map(vmInstance =>
          vmInstance.vmId === updatedVmInstance.vmId ? updatedVmInstance : vmInstance
        )
      );

      // Update selected VM instance with camelCase data
      setSelectedVmInstance(updatedVmInstance);
      // setSelectedVmInstance(null); // Optionally close modal

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

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem', backgroundColor: 'white', borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0', transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        <h2 style={{
          fontSize: '1.25rem', fontWeight: '600', color: '#111827',
          display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0
        }}>
          <HardDrive size={18} />
          VM Instances {hasLoaded ? `(${vmInstances.length})` : ''}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading && <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />}
          <button
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                     width: '24px', height: '24px', borderRadius: '50%', background: '#2563eb',
                     color: 'white', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Add new VM instance"
          >
            <Plus size={16} />
          </button>
          <div style={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white', borderRadius: '0 0 0.5rem 0.5rem', padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto', transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>Loading VM instances...</p>
              <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>VM Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>VM Address</th>
                </tr>
              </thead>
              <tbody>
                {vmInstances.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No VM instances found</td></tr>
                ) : (
                  vmInstances.map((vmInstance) => (
                    <tr key={vmInstance.vmId} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                        onClick={() => handleRowClick(vmInstance)}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.vmId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.vmName}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vmInstance.vmAddress || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedVmInstance && (
        <EditableDetailsModal
          isOpen={selectedVmInstance !== null}
          onClose={() => {
            setSelectedVmInstance(null);
            setAssignedSoftwareIds([]); // Clear assignments when closing modal
            setAssignmentError(null); // Clear errors
          }}
          title={`VM Instance Details: ${selectedVmInstance.vmName}`}
          data={selectedVmInstance}
          fields={detailsFields}
          onSave={handleUpdateVmInstance}
        >
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              Assigned Software
            </h3>
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