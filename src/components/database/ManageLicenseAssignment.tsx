'use client';

import React, { useState, useEffect } from 'react';
import { PcOverview, VmInstance } from '../../types/database';

// Must match the structure passed from LicensesList
interface FetchedAssignment {
  assignmentId: number;
  licenseId: number;
  pcId: number | null;
  vmId: number | null;
  assignedOn: string | null;
}

interface ManageLicenseAssignmentProps {
  allPcs: PcOverview[];
  allVms: VmInstance[];
  currentAssignment: FetchedAssignment | null;
  isLoading: boolean;
  error: string | null;
  onAssign: (targetType: 'pc' | 'vm', targetId: number) => Promise<void>; // Mark as async void if needed
  onUnassign: () => Promise<void>; // Mark as async void if needed
}

export default function ManageLicenseAssignment({
  allPcs,
  allVms,
  currentAssignment,
  isLoading,
  error,
  onAssign,
  onUnassign,
}: ManageLicenseAssignmentProps) {

  const [selectedPc, setSelectedPc] = useState<string>(''); // Store ID as string for select value
  const [selectedVm, setSelectedVm] = useState<string>(''); // Store ID as string for select value

  // Reset selections when assignment changes (e.g., after assign/unassign)
  useEffect(() => {
    setSelectedPc('');
    setSelectedVm('');
  }, [currentAssignment]);

  const handleAssignClick = () => {
    if (selectedPc) {
      onAssign('pc', parseInt(selectedPc, 10));
    } else if (selectedVm) {
      onAssign('vm', parseInt(selectedVm, 10));
    }
  };

  const handleUnassignClick = () => {
    onUnassign();
  };

  // Determine current assignment details for display
  const getAssignmentDetails = () => {
    if (!currentAssignment) return "Not assigned";
    let targetName = 'Unknown';
    if (currentAssignment.pcId) {
      const pc = allPcs.find(p => p.pcId === currentAssignment.pcId);
      targetName = pc ? `${pc.activeUser || 'Unknown User'}'s PC (${pc.pcName || '-'})` : `PC ID: ${currentAssignment.pcId}`;
    } else if (currentAssignment.vmId) {
      const vm = allVms.find(v => v.vmId === currentAssignment.vmId);
      targetName = vm ? `${vm.vmName} (ID: ${vm.vmId})` : `VM ID: ${currentAssignment.vmId}`;
    }
    return `Assigned to: ${targetName}${currentAssignment.assignedOn ? ' on ' + new Date(currentAssignment.assignedOn).toLocaleDateString() : ''}`;
  };

  return (
    <div>
      {isLoading && <p>Loading assignment details...</p>}
      {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>Error: {error}</p>}

      {/* Current Assignment Display */}
      <div style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '500' }}>
        {getAssignmentDetails()}
      </div>

      {/* Assignment Controls */}
      {!currentAssignment ? (
        // Show controls to assign
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {/* PC Dropdown */}
          <select
            value={selectedPc}
            onChange={(e) => {
              setSelectedPc(e.target.value);
              if (e.target.value) setSelectedVm(''); // Clear VM if PC selected
            }}
            disabled={isLoading || selectedVm !== ''}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Assign to PC...</option>
            {allPcs.map(pc => (
              <option key={pc.pcId} value={pc.pcId}> 
                {pc.activeUser || 'N/A'} - {pc.pcName || 'N/A'} (ID: {pc.pcId})
              </option>
            ))}
          </select>

          <span>OR</span>

          {/* VM Dropdown */}
          <select
            value={selectedVm}
            onChange={(e) => {
              setSelectedVm(e.target.value);
              if (e.target.value) setSelectedPc(''); // Clear PC if VM selected
            }}
            disabled={isLoading || selectedPc !== ''}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Assign to VM...</option>
            {allVms.map(vm => (
              <option key={vm.vmId} value={vm.vmId}>
                {vm.vmName} (ID: {vm.vmId})
              </option>
            ))}
          </select>

          <button
            onClick={handleAssignClick}
            disabled={isLoading || (!selectedPc && !selectedVm)}
            style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Assign
          </button>
        </div>
      ) : (
        // Show button to unassign
        <button
          onClick={handleUnassignClick}
          disabled={isLoading}
          style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Unassign License
        </button>
      )}
    </div>
  );
} 