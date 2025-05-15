'use client';

import React, { useState, useMemo } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';

// Interface for assigned license data (matches API response - snake_case)
interface AssignedLicenseInfo {
    license_id: number;
    license_name: string | null;
    license_type: string | null;
    software_name: string;
    major_version: string | null;
    assigned_on: string | null; 
}

interface ManageVMLicenseAssignmentsProps {
  vm_id: number; // Added vm_id to know which VM we are dealing with
  assigned_licenses: AssignedLicenseInfo[];
  on_unassign: (license_id: number) => Promise<void>; // Function to call when unassign is clicked
  is_loading: boolean; // Loading state for assign/unassign actions by parent
  error: string | null;   // Error message for assign/unassign actions from parent
}

export default function ManageVMLicenseAssignments({
  vm_id,
  assigned_licenses,
  on_unassign,
  is_loading,
  error
}: ManageVMLicenseAssignmentsProps) {

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const assignedLicenseIds = useMemo(() => {
    return assigned_licenses.map(l => l.license_id);
  }, [assigned_licenses]);

  const handleUnassignClick = async (license_id: number) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await on_unassign(license_id);
    } catch (err) {
      console.error("Unassign license from VM failed:", err);
      setActionError(err instanceof Error ? err.message : 'Failed to unassign license from VM');
    } finally {
      setActionLoading(false);
    }
  };

  if (is_loading && !actionLoading) return <p>Loading assigned licenses for VM...</p>; 
  if (error && !actionError) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      {/* Display Action Error if any */}
      {actionError && <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>{actionError}</p>}

      {/* List of Assigned Licenses */}
      {assigned_licenses.length === 0 && !actionError ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No licenses currently assigned to this VM.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
          {assigned_licenses.map((license) => (
            <li 
              key={license.license_id}
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
                <span style={{ fontWeight: '500' }}>{license.software_name || 'Unknown Software'}{license.major_version ? ` (${license.major_version})` : ''}</span>
                <span style={{ color: '#6b7280' }}> - {license.license_name || `ID: ${license.license_id}`} ({license.license_type || 'N/A'})</span>
                {license.assigned_on && 
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    (Assigned: {new Date(license.assigned_on).toLocaleDateString()})
                  </span>
                }
              </div>
              <button
                onClick={() => handleUnassignClick(license.license_id)}
                disabled={actionLoading}
                title="Unassign License"
                style={{
                  background: 'none',
                  border: 'none',
                  color: actionLoading ? '#9ca3af' : '#dc2626',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  padding: '0.25rem'
                }}
              >
                {actionLoading && assignedLicenseIds.includes(license.license_id) ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={18} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 