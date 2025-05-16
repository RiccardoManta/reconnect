'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PcOverview, VmInstance, License } from '../../types/database'; // License is needed for current_assignment_details
import { PlusCircle, XCircle, RefreshCw, Ban } from 'lucide-react';

interface ManageLicenseAssignmentProps {
  license_id: number;
  license_name?: string | null; // For display purposes
  all_pcs: PcOverview[];
  all_vms: VmInstance[];
  current_assignment_details: License | null; // Pass the full License object which contains assigned_to_name and assigned_to_type
  on_assign: (license_id: number, target_type: 'pc' | 'vm', target_id: number) => Promise<void>;
  on_unassign: (license_id: number) => Promise<void>;
  is_loading: boolean; // Parent loading state for assign/unassign actions
  error: string | null;    // Parent error state
  isReadOnly?: boolean; // Added isReadOnly prop (camelCase)
}

export default function ManageLicenseAssignment({
  license_id,
  license_name,
  all_pcs,
  all_vms,
  current_assignment_details,
  on_assign,
  on_unassign,
  is_loading,
  error,
  isReadOnly // Destructure isReadOnly
}: ManageLicenseAssignmentProps) {

  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCurrentlyAssigned = !!current_assignment_details?.assigned_to_type;
  const assignedToName = current_assignment_details?.assigned_to_name;
  const assignedToTypeDisplay = current_assignment_details?.assigned_to_type === 'pc' ? 'PC' : current_assignment_details?.assigned_to_type === 'vm' ? 'VM' : null;

  const availableTargets = useMemo(() => {
    const pcOptions = all_pcs.map(pc => ({
      value: `pc-${pc.pc_id}`,
      label: `PC: ${pc.pc_name || `ID: ${pc.pc_id}`}`,
    }));
    const vmOptions = all_vms.map(vm => ({
      value: `vm-${vm.vm_id}`,
      label: `VM: ${vm.vm_name || `ID: ${vm.vm_id}`}`,
    }));
    return [...pcOptions, ...vmOptions].sort((a, b) => a.label.localeCompare(b.label));
  }, [all_pcs, all_vms]);

  // Effect to potentially pre-select the target in dropdown if already assigned
  // This is optional for visual consistency, main thing is display below
  useEffect(() => {
    if (isCurrentlyAssigned && current_assignment_details?.assigned_to_id) {
      const currentTargetValue = `${current_assignment_details.assigned_to_type}-${current_assignment_details.assigned_to_id}`;
      // Check if this target is actually in availableTargets to prevent invalid select state
      if (availableTargets.some(t => t.value === currentTargetValue)) {
        // setSelectedTarget(currentTargetValue); // Commenting out for now to allow easy re-assignment
                                             // User can see current assignment below and select a new one if needed.
      }
    } else {
      setSelectedTarget(''); // Clear selection if unassigned
    }
  // }, [isCurrentlyAssigned, current_assignment_details, availableTargets]); // Dependency on availableTargets removed for simplicity now
  }, [isCurrentlyAssigned, current_assignment_details]);

  const handleAssignClick = async () => {
    if (isReadOnly) return; // Prevent action if read-only
    if (!selectedTarget) {
      setActionError('Please select a PC or VM to assign the license to.');
      return;
    }
    const [type, idStr] = selectedTarget.split('-');
    const id = parseInt(idStr, 10);

    if (!type || isNaN(id) || (type !== 'pc' && type !== 'vm')) {
      setActionError('Invalid target selected.');
      return;
    }

    // Prevent re-assigning to the same target if it's already assigned there
    if (isCurrentlyAssigned && current_assignment_details?.assigned_to_type === type && current_assignment_details?.assigned_to_id === id) {
      setActionError(`This license is already assigned to ${assignedToName}. Select a different target to re-assign.`);
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await on_assign(license_id, type as 'pc' | 'vm', id);
      // setSelectedTarget(''); // Don't reset dropdown, parent will refresh and effect will run
    } catch (err) {
      console.error("Assign license failed from ManageLicenseAssignment:", err);
      setActionError(err instanceof Error ? err.message : 'Failed to assign license');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignClick = async () => {
    if (isReadOnly) return; // Prevent action if read-only
    if (!isCurrentlyAssigned) return; // Should not happen if button is hidden
    setActionLoading(true);
    setActionError(null);
    try {
      await on_unassign(license_id);
    } catch (err) {
      console.error("Unassign license failed from ManageLicenseAssignment:", err);
      setActionError(err instanceof Error ? err.message : 'Failed to unassign license');
    } finally {
      setActionLoading(false);
    }
  };

  if (is_loading && !actionLoading) return <p>Loading assignment information...</p>;
  if (error && !actionError) return <p style={{ color: 'red' }}>Error: {error}</p>; 

  return (
    <div>
      <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem' }}>
        License: <span style={{fontWeight: 'bold'}}>{license_name || `ID: ${license_id}`}</span>
      </h4>

      {/* Assignment Controls - Always Visible */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <select
          value={selectedTarget}
          onChange={(e) => {
            setSelectedTarget(e.target.value);
            setActionError(null); // Clear error on new selection
          }}
          disabled={actionLoading || isReadOnly}
          style={{
            flexGrow: 1,
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
            cursor: isReadOnly ? 'not-allowed' : 'auto'
          }}
        >
          <option value="">Select PC/VM to assign...</option>
          {availableTargets.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssignClick}
          disabled={actionLoading || !selectedTarget || isReadOnly}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: (actionLoading || !selectedTarget || isReadOnly) ? '#9ca3af' : '#2563eb',
            color: 'white',
            fontSize: '0.875rem',
            cursor: (actionLoading || !selectedTarget || isReadOnly) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          title={isReadOnly ? "Read-only: Cannot assign license" : (isCurrentlyAssigned ? 'Update Assignment' : 'Assign License')}
        >
          {isReadOnly && <Ban size={16} style={{marginRight: '0.25rem'}}/>}
          {actionLoading && selectedTarget ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <PlusCircle size={16} />}
          {isCurrentlyAssigned ? 'Update Assignment' : 'Assign'}
        </button>
      </div>

      {/* Current Assignment Status and Unassign Button */}
      <div style={{ marginTop: '1rem', padding: '0.75rem', border: isCurrentlyAssigned ? '1px solid #e5e7eb' : 'none', borderRadius: '0.25rem', backgroundColor: isCurrentlyAssigned ? '#f9fafb' : 'transparent' }}>
        {isCurrentlyAssigned ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Currently assigned to: <span style={{ fontWeight: 'bold' }}>{assignedToName}</span> ({assignedToTypeDisplay})
            </p>
            <button
              onClick={handleUnassignClick}
              disabled={actionLoading || isReadOnly}
              title={isReadOnly ? "Read-only: Cannot unassign license" : "Unassign License"}
              style={{
                background: 'none',
                border: 'none',
                color: (actionLoading || isReadOnly) ? '#9ca3af' : '#dc2626',
                cursor: (actionLoading || isReadOnly) ? 'not-allowed' : 'pointer',
                padding: '0.25rem'
              }}
            >
              {isReadOnly ? <Ban size={18}/> : 
                (actionLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={18} />)
              }
            </button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            This license is not currently assigned.
          </p>
        )}
      </div>
      {actionError && <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>{actionError}</p>}
    </div>
  );
} 