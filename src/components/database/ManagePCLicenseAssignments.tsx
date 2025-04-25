'use client';

import React from 'react';

// Use the same interface defined in PcOverviewList
interface AssignedLicenseInfo {
    licenseId: number;
    licenseName: string | null;
    licenseType: string | null;
    softwareName: string;
    majorVersion: string | null;
    assignedOn: string | null; 
}

interface ManagePCLicenseAssignmentsProps {
  assignedLicenses: AssignedLicenseInfo[];
  isLoading: boolean; // For the parent loading state
  error: string | null; // For the parent error state
  onUnassign: (licenseId: number) => Promise<void>; // Function to call when unassign is clicked
}

export default function ManagePCLicenseAssignments({
  assignedLicenses,
  isLoading, // Display parent loading if needed
  error,     // Display parent error if needed
  onUnassign,
}: ManagePCLicenseAssignmentsProps) {

  // Optional: Internal loading state for the unassign action itself
  const [unassigningId, setUnassigningId] = React.useState<number | null>(null);

  const handleUnassignClick = async (licenseId: number) => {
    // Optional: Confirmation
    // if (!confirm('Are you sure you want to unassign this license from this PC?')) return;
    setUnassigningId(licenseId);
    try {
      await onUnassign(licenseId);
      // Parent component should handle refetching/state update
    } catch (err) {
      // Parent component should ideally display the error
      console.error("Unassign failed:", err);
      // Optionally show a temporary error message here
    } finally {
      setUnassigningId(null);
    }
  };

  // Don't show anything if the parent is loading or has an error
  if (isLoading) return <p>Loading assigned licenses...</p>; 
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  if (assignedLicenses.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No licenses currently assigned to this PC.</p>;
  }

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}> 
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {assignedLicenses.map((license) => (
          <li 
            key={license.licenseId}
            style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem 0.25rem', 
              borderBottom: '1px solid #e5e7eb',
              fontSize: '0.875rem' 
            }}
          >
            <div>
              <span style={{ fontWeight: '500' }}>{license.softwareName}{license.majorVersion ? ` (${license.majorVersion})` : ''}</span>
              <span style={{ color: '#6b7280' }}> - {license.licenseName || `ID: ${license.licenseId}`} ({license.licenseType || '-'})</span>
              {license.assignedOn && 
                <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  (Assigned: {new Date(license.assignedOn).toLocaleDateString()})
                </span>
              }
            </div>
            <button
              onClick={() => handleUnassignClick(license.licenseId)}
              disabled={unassigningId === license.licenseId} // Disable button during its own action
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.8rem',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {unassigningId === license.licenseId ? '...' : 'Unassign'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 